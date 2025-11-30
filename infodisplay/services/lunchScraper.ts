import axios from 'axios';
import * as cheerio from 'cheerio';
import { Restaurant } from '../types';

// Cache configuration
interface CacheEntry {
  data: Restaurant[];
  timestamp: number;
  expiresAt: number;
}

class LunchCache {
  private cache: CacheEntry | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MIN_REQUEST_INTERVAL = 5 * 60 * 1000; // 5 minutes between API calls
  private lastRequestTime = 0;
  private isRequestInProgress = false;

  isValid(): boolean {
    return this.cache !== null && Date.now() < this.cache.expiresAt;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    return !this.isRequestInProgress && (now - this.lastRequestTime) >= this.MIN_REQUEST_INTERVAL;
  }

  setData(data: Restaurant[]): void {
    const now = Date.now();
    this.cache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    };
    this.lastRequestTime = now;
  }

  getData(): Restaurant[] | null {
    return this.cache?.data || null;
  }

  setRequestInProgress(inProgress: boolean): void {
    this.isRequestInProgress = inProgress;
  }
}

const cache = new LunchCache();

// Rate limiter for individual requests
class RequestLimiter {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds between requests

  async addRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request failed:', error);
        }
        
        // Wait between requests to avoid overwhelming servers
        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.DELAY_BETWEEN_REQUESTS));
        }
      }
    }

    this.isProcessing = false;
  }
}

const requestLimiter = new RequestLimiter();

// Today's date in Finnish format
const getTodayFinnish = (): string => {
  const weekdays: Record<string, string> = {
    'Monday': 'Maanantaina',
    'Tuesday': 'Tiistaina', 
    'Wednesday': 'Keskiviikkona',
    'Thursday': 'Torstaina',
    'Friday': 'Perjantaina',
    'Saturday': 'Lauantaina',
    'Sunday': 'Sunnuntaina'
  };
  
  const today = new Date();
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
  const day = today.getDate();
  const month = today.getMonth() + 1;
  
  return `${weekdays[weekday]} ${day}.${month}.`;
};

// Scraper for lounaat.info sites
async function scrapeLounaatSite(url: string): Promise<Restaurant> {
  return requestLimiter.addRequest(async () => {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fi,en-US;q=0.7,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const restaurant = $('h1').first().text().trim() || url.split('/').pop() || 'Unknown Restaurant';
      const todayFinnish = getTodayFinnish();

      // Find today's menu
      const menuContainer = $('#menu');
      const items = menuContainer.find('.item');
      
      let menuItems: any[] = [];
      let foundToday = false;

      items.each((_, item) => {
        const itemHeader = $(item).find('.item-header');
        if (itemHeader.length) {
          const date = itemHeader.text().trim();
          
          if (date === todayFinnish) {
            foundToday = true;
            $(item).find('.menu-item').each((_, menuItem) => {
              const price = $(menuItem).find('.price').text().trim() || 'N/A';
              const dish = $(menuItem).find('.dish').text().trim() || 'N/A';
              const info = $(menuItem).find('.info').text().trim() || 'N/A';
              
              if (dish && dish !== 'N/A') {
                menuItems.push({ dish, price, info });
              }
            });
          }
        }
      });

      if (!foundToday) {
        menuItems.push({
          dish: 'Ei tämän päivän listaa saatavilla',
          price: '',
          info: ''
        });
      }

      return {
        restaurant,
        menu: [{ date: todayFinnish, menu: menuItems }]
      };
      
    } catch (error: any) {
      console.error(`Error scraping ${url}:`, error.message);
      return {
        restaurant: url.split('/').pop() || 'Unknown Restaurant',
        error: `Virhe haettaessa menua: ${error.message}`,
        menu: []
      };
    }
  });
}

// List of restaurant URLs to scrape
const RESTAURANT_URLS = [
  'https://www.lounaat.info/lounas/food-co-tulli-business-park/tampere',
  'https://www.lounaat.info/lounas/myllarit/tampere',
  'https://www.lounaat.info/lounas/old-mates-tampere/tampere',
  'https://www.lounaat.info/lounas/aleksis/tampere'
];

export async function scrapeLunchData(): Promise<Restaurant[]> {
  // Return cached data if valid and fresh
  if (cache.isValid()) {
    console.log('Returning cached lunch data');
    return cache.getData() || [];
  }

  // Return stale cache if we can't make a new request yet
  if (!cache.canMakeRequest()) {
    console.log('Rate limit active, returning stale cache if available');
    const cachedData = cache.getData();
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    cache.setRequestInProgress(true);
    console.log('Fetching fresh lunch data...');
    
    // Scrape all restaurants with rate limiting
    const results = await Promise.allSettled(
      RESTAURANT_URLS.map(url => scrapeLounaatSite(url))
    );

    const restaurants: Restaurant[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to scrape ${RESTAURANT_URLS[index]}:`, result.reason);
        return {
          restaurant: RESTAURANT_URLS[index].split('/').pop() || 'Unknown Restaurant',
          error: 'Virhe haettaessa menua',
          menu: []
        };
      }
    });

    // Cache the results
    cache.setData(restaurants);
    console.log(`Successfully cached ${restaurants.length} restaurant menus`);
    
    return restaurants;
    
  } catch (error: any) {
    console.error('Error in scrapeLunchData:', error);
    
    // Return stale cache as fallback
    const cachedData = cache.getData();
    if (cachedData) {
      console.log('Returning stale cache due to error');
      return cachedData;
    }
    
    // Last resort: return error state
    return [{
      restaurant: 'Virhe',
      error: 'Virhe haettaessa lounaslistoja',
      menu: []
    }];
  } finally {
    cache.setRequestInProgress(false);
  }
}
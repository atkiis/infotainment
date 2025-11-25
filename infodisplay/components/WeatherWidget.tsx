import React, { useEffect, useRef, useState } from 'react';
import { CurrentWeather } from './CurrentWeather';
import { Play, Pause } from 'lucide-react';

// Declare Leaflet global since we are loading it via CDN
declare global {
  const L: any;
}

interface RadarFrame {
  time: number;
  path: string;
}
interface WeatherEmoji {
  id: string;
  label: string;
  icon: string;
}

export const WEATHER_EMOJI: WeatherEmoji[] = [
  { id: 'sunny', label: 'Sunny', icon: '☀️' },
  { id: 'partly-cloudy', label: 'Partly Cloudy', icon: '⛅️' },
  { id: 'cloudy', label: 'Cloudy', icon: '☁️' },
  { id: 'rainy', label: 'Rainy', icon: '🌧️' },
  { id: 'storm', label: 'Thunderstorm', icon: '⛈️' },
  { id: 'snow', label: 'Snowy', icon: '❄️' },
  { id: 'wind', label: 'Windy', icon: '🌬️' },
  { id: 'fog', label: 'Foggy', icon: '🌫️' }
];
interface TempLocation {
  name: string;
  lat: number;
  lon: number;
  temp?: number;
}

const LOCATIONS: TempLocation[] = [
  { name: "Tampere", lat: 61.4978, lon: 23.7610 },
  { name: "Nokia", lat: 61.4778, lon: 23.5111 },
  { name: "Kangasala", lat: 61.4633, lon: 24.0644 },
  { name: "Lempäälä", lat: 61.3133, lon: 23.7511 },
  { name: "Ylöjärvi", lat: 61.5564, lon: 23.5961 }
];

export const WeatherWidget: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const radarLayers = useRef<any[]>([]);
  const tempMarkers = useRef<any[]>([]);
  
  // Tampere Coordinates
  const centerPosition = [61.4978, 23.7610]; 

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [apiHost, setApiHost] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstance.current) return; // Prevent double init

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false, // Keep it static for infotainment
      doubleClickZoom: false
    }).setView(centerPosition, 9); // Slightly wider zoom to see surrounding temps

    // Base Layer - CartoDB Light
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstance.current = map;

    // Fetch Radar Configuration
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data.radar && data.radar.past) {
          setApiHost(data.host);
          
          const past = data.radar.past || [];
          const nowcast = data.radar.nowcast || [];
          
          // Combine and sort by time
          const allFrames = [...past, ...nowcast].sort((a: any, b: any) => a.time - b.time);
          
          // Take the last 15 frames for a good loop
          const selectedFrames = allFrames.slice(-15);
          setFrames(selectedFrames);
          setIsLoading(false);
        }
      })
      .catch(err => console.error("Error loading radar data:", err));

    // Fetch Temperatures for surrounding areas
    fetchTemperatures(map);

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Helper to fetch temps
  const fetchTemperatures = async (map: any) => {
    try {
      // Build querystring
      const lats = LOCATIONS.map(l => l.lat).join(',');
      const lons = LOCATIONS.map(l => l.lon).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m`;

      const res = await fetch(url);
      const data = await res.json();

      // If single location, api returns object. If multiple, returns array.
      const results = Array.isArray(data) ? data : [data];

      // Clear old markers
      tempMarkers.current.forEach(m => map.removeLayer(m));
      tempMarkers.current = [];

      results.forEach((locData: any, idx: number) => {
        const loc = LOCATIONS[idx];
        const temp = Math.round(locData.current.temperature_2m);
        
        // Create Custom HTML Marker for Temp
        const iconHtml = `
          <div class="flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
            <div class="bg-white/90 text-[#005f8b] font-bold text-sm px-2 py-0.5 rounded-md shadow-sm border border-gray-200 whitespace-nowrap backdrop-blur-sm">
              ${temp}°
            </div>
             <div class="text-[10px] font-semibold text-gray-500 mt-0.5 text-shadow-white">${loc.name}</div>
          </div>
        `;
        
        const icon = L.divIcon({
          className: 'temp-marker-icon', // custom class
          html: iconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20] // center it
        });

        const marker = L.marker([loc.lat, loc.lon], { icon, zIndexOffset: 1000 }).addTo(map);
        tempMarkers.current.push(marker);
      });

    } catch (e) {
      console.error("Error fetching map temperatures", e);
    }
  };

  // 2. Manage Radar Layers
  useEffect(() => {
    if (!mapInstance.current || frames.length === 0 || !apiHost) return;

    // Clear old layers
    radarLayers.current.forEach(layer => mapInstance.current.removeLayer(layer));
    radarLayers.current = [];

    // Create new tile layers using API provided Host and Path
    frames.forEach((frame) => {
      // Construct correct RainViewer V2 URL: host + path + tile_spec
      // Size: 256, Color: 2 (Universal Blue), Options: 1_1 (Smooth)
      const url = `${apiHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
      
      const layer = L.tileLayer(url, {
        opacity: 0, // Start hidden
        zIndex: 100,
        maxZoom: 19
      });
      layer.addTo(mapInstance.current);
      radarLayers.current.push(layer);
    });

  }, [frames, apiHost]);

  // 3. Animation Loop
  useEffect(() => {
    if (radarLayers.current.length === 0 || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % radarLayers.current.length;
        
        // Update Opacity for smoother transition effect?
        // Leaflet handles opacity instantly, but for radar loop, we just toggle visibility.
        radarLayers.current.forEach((layer, idx) => {
          if (idx === nextIndex) {
            layer.setOpacity(0.8); // Active frame
          } else {
            layer.setOpacity(0); // Hidden frames
          }
        });

        return nextIndex;
      });
    }, 800); // Change frame every 800ms

    return () => clearInterval(interval);
  }, [frames, isPlaying]);

  // Helper to format timestamp
  const getFormattedTime = (ts: number) => {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden flex flex-col relative">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center z-10 bg-white relative">
        <h2 className="text-xl font-semibold text-[#005f8b] border-b-2 border-[#ffa500] inline-block pb-1">
          <span className="mr-2">🌦️</span>
          Weather Radar
        </h2>
        
        {/* Radar Controls / Status */}
        {!isLoading && frames.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shadow-sm">
                <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-[#005f8b] transition-colors">
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <span className="w-12 text-center tabular-nums">{getFormattedTime(frames[currentIndex]?.time)}</span>
            </div>
        )}
      </div>
      
      {/* Overlay Current Weather (Top Right) */}
      <CurrentWeather />

      <div className="flex-grow relative bg-gray-100 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />
        
        {/* Simple Legend */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur px-3 py-2 rounded-md shadow-sm text-[10px] text-gray-600 pointer-events-none border border-gray-100">
            <div className="font-semibold mb-1 text-gray-800">Rain Intensity</div>
            <div className="w-32 h-1.5 rounded-full bg-gradient-to-r from-[#d4f1f9] via-[#00a5ff] to-[#00008b]"></div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-400">
               <span>Light</span>
               <span>Heavy</span>
            </div>
        </div>
      </div>
      
      <style>{`
        .text-shadow-white {
          text-shadow: 0 1px 2px rgba(255,255,255,0.9);
        }
      `}</style>
    </div>
  );
};

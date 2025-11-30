import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudSun,
  Moon,
  Radar,
  Droplets
} from 'lucide-react';

// Declare Leaflet global since we are loading it via CDN
declare global {
  const L: any;
}

interface RadarFrame {
  time: number;
  path: string;
}

interface TempLocation {
  name: string;
  lat: number;
  lon: number;
}

interface HourlyForecast {
  time: string;
  temp: number;
  code: number;
  rainProb: number;
}

const LOCATIONS: TempLocation[] = [
  { name: 'Tampere', lat: 61.4978, lon: 23.761 },
  { name: 'Nokia', lat: 61.4778, lon: 23.5111 },
  { name: 'Kangasala', lat: 61.4633, lon: 24.0644 },
  { name: 'Lempäälä', lat: 61.3133, lon: 23.7511 },
  { name: 'Ylöjärvi', lat: 61.5564, lon: 23.5961 }
];

const getWeatherIcon = (code: number, isNight = false) => {
  if (code === 0) return isNight ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-amber-400" />;
  if (code === 1 || code === 2 || code === 3) return <CloudSun className="w-5 h-5 text-sky-400" />;
  if (code >= 45 && code <= 48) return <CloudFog className="w-5 h-5 text-slate-400" />;
  if (code >= 51 && code <= 67) return <CloudRain className="w-5 h-5 text-blue-500" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="w-5 h-5 text-cyan-300" />;
  if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-600" />;
  if (code >= 85 && code <= 86) return <CloudSnow className="w-5 h-5 text-cyan-400" />;
  if (code >= 95) return <CloudLightning className="w-5 h-5 text-purple-500" />;
  return <Cloud className="w-5 h-5 text-gray-400" />;
};

export const WeatherWidget: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const radarLayers = useRef<any[]>([]);
    const tempMarkers = useRef<any[]>([]);

    const centerPosition = [61.4978, 23.761];

    const [frames, setFrames] = useState<RadarFrame[]>([]);
    const [apiHost, setApiHost] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentWind, setCurrentWind] = useState<number | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false
    }).setView(centerPosition, 9);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstance.current = map;

    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data.radar && data.radar.past) {
          setApiHost(data.host);
          const past = data.radar.past || [];
          const nowcast = data.radar.nowcast || [];
          const allFrames = [...past, ...nowcast].sort((a: any, b: any) => a.time - b.time);
          setFrames(allFrames.slice(-15));
          setIsLoading(false);
        }
      })
      .catch(err => console.error('Error loading radar data:', err));

    fetchWeather(map);
    const weatherInterval = setInterval(() => fetchWeather(map), 15 * 60 * 1000);

    return () => {
      clearInterval(weatherInterval);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const fetchWeather = async (map: any) => {
    try {
      const lats = LOCATIONS.map(l => l.lat).join(',');
      const lons = LOCATIONS.map(l => l.lon).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&forecast_days=2`;

      const res = await fetch(url);
      const data = await res.json();
      const results = Array.isArray(data) ? data : [data];

      if (results[0]?.current) {
        setCurrentTemp(results[0].current.temperature_2m);
        setCurrentWind(results[0].current.wind_speed_10m);
      }

      if (results[0]?.hourly) {
        const hourly = results[0].hourly;
        const now = new Date();
        const currentHourIndex = hourly.time.findIndex((t: string) => new Date(t) > now);
        const startIndex = currentHourIndex !== -1 ? currentHourIndex : 0;
        const next8Hours: HourlyForecast[] = [];

        for (let i = startIndex; i < startIndex + 8; i++) {
          if (hourly.time[i]) {
            next8Hours.push({
              time: hourly.time[i],
              temp: hourly.temperature_2m[i],
              code: hourly.weather_code[i],
              rainProb: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0
            });
          }
        }
        setHourlyForecast(next8Hours);
      }

      tempMarkers.current.forEach(m => map.removeLayer(m));
      tempMarkers.current = [];

      results.forEach((locData: any, idx: number) => {
        if (!locData?.current) return;
        const loc = LOCATIONS[idx];
        const temp = Math.round(locData.current.temperature_2m);

        const iconHtml = `
          <div class="flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
            <div class="bg-white/90 text-sky-700 font-bold text-sm px-2 py-0.5 rounded-md shadow-sm border border-gray-200 whitespace-nowrap backdrop-blur-sm">
              ${temp}°
            </div>
            <div class="text-[10px] font-semibold text-gray-500 mt-0.5 text-shadow-white">${loc.name}</div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'temp-marker-icon',
          html: iconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker([loc.lat, loc.lon], { icon, zIndexOffset: 1000 }).addTo(map);
        tempMarkers.current.push(marker);
      });
    } catch (e) {
      console.error('Error fetching map temperatures', e);
    }
  };

  useEffect(() => {
    if (!mapInstance.current || frames.length === 0 || !apiHost) return;

    radarLayers.current.forEach(layer => mapInstance.current.removeLayer(layer));
    radarLayers.current = [];

    frames.forEach(frame => {
      const url = `${apiHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
      const layer = L.tileLayer(url, { opacity: 0, zIndex: 100, maxZoom: 19 });
      layer.addTo(mapInstance.current);
      radarLayers.current.push(layer);
    });
  }, [frames, apiHost]);

  useEffect(() => {
    if (radarLayers.current.length === 0 || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % radarLayers.current.length;
        radarLayers.current.forEach((layer, idx) => {
          layer.setOpacity(idx === nextIndex ? 0.8 : 0);
        });
        return nextIndex;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [frames, isPlaying]);

  const getFormattedTime = (ts: number) => {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
  };

  const getHourString = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden relative group">
      <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center z-[401] bg-white/95 backdrop-blur-sm absolute top-0 w-full shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="bg-sky-100 p-1 rounded-lg text-sky-700">
            <Radar className="w-4 h-4" />
          </div>
          <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Weather Radar</h2>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 shadow-sm rounded-lg px-2 py-1">
            <div className="flex items-center gap-1.5">
              <div className="text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                  <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-800">
                {currentTemp !== null ? `${Math.round(currentTemp)}°` : '--'}
              </span>
            </div>
          </div>

          {!isLoading && frames.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 shadow-sm">
              <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-sky-700 transition-colors">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="w-12 text-center tabular-nums text-[11px] font-semibold">{getFormattedTime(frames[currentIndex]?.time)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-gray-100 relative">
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

        <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 z-[400] flex items-stretch h-[5.5rem] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="w-48 px-3 py-2 flex flex-col justify-center border-r border-gray-100 flex-shrink-0">
            <p className="text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">Rain Intensity</p>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#d4f1f9] via-[#00a5ff] to-[#00008b] mb-1"></div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Light</span>
              <span>Heavy</span>
            </div>
          </div>

          <div className="flex-1 flex items-center overflow-x-auto overflow-y-hidden px-4 gap-5 scrollbar-hide">
            {hourlyForecast.length > 0 ? (
              hourlyForecast.map((hour, idx) => {
                const hourDate = new Date(hour.time);
                const h = hourDate.getHours();
                const isNight = h >= 22 || h <= 6;

                return (
                  <div key={idx} className="flex flex-col items-center min-w-[4rem] gap-0.5 text-center">
                    <span className="text-[11px] font-semibold text-slate-500 leading-tight">{getHourString(hour.time)}</span>
                    <div className="flex items-center justify-center h-6">{getWeatherIcon(hour.code, isNight)}</div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-slate-700 tabular-nums">{Math.round(hour.temp)}°</span>
                      <div className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${hour.rainProb > 0 ? 'text-sky-600' : 'text-gray-300'}`}>
                        <Droplets className="w-3 h-3" />
                        <span>{hour.rainProb}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-gray-400 italic pl-2">Loading forecast...</span>
            )}
          </div>

          <div className="px-4 flex items-center justify-center border-l border-gray-100 bg-gray-50/50">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Next 8 Hours</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .text-shadow-white {
          text-shadow: 0 1px 2px rgba(255,255,255,0.9);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

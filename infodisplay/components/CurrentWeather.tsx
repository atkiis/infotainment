import React, { useEffect, useState } from 'react';
import { CloudSun, Wind, Droplets } from 'lucide-react';

interface WeatherData {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
}

export const CurrentWeather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Tampere coordinates: 61.4991, 23.7871
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=61.4991&longitude=23.7871&current=temperature_2m,wind_speed_10m,weather_code&wind_speed_unit=ms');
        const data = await res.json();
        setWeather({
          temperature: data.current.temperature_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code
        });
      } catch (e) {
        console.error("Failed to fetch weather", e);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Update every 10 mins
    return () => clearInterval(interval);
  }, []);

  if (!weather) return null;

  return (
    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-md border border-[#005f8b]/20 z-20 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <CloudSun className="w-6 h-6 text-[#ffa500]" />
        <div>
            <span className="text-2xl font-bold text-[#002b45]">{weather.temperature}°C</span>
        </div>
      </div>
      <div className="h-8 w-px bg-gray-300 mx-1"></div>
      <div className="flex flex-col text-xs text-[#005f8b] font-medium">
        <div className="flex items-center gap-1">
            <Wind className="w-3 h-3" />
            <span>{weather.windSpeed} m/s</span>
        </div>
        <div className="flex items-center gap-1">
            <span className="capitalize">Tampere</span>
        </div>
      </div>
    </div>
  );
};
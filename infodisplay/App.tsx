import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { WeatherWidget } from './components/WeatherWidget';
import { TrainTable } from './components/TrainTable';
import { LunchSlider } from './components/LunchSlider';
import { NewsTicker } from './components/NewsTicker';
import { fetchTrainData } from './services/trainService';
import { fetchLunchData } from './services/lunchService';
import { TrainDisplayData, Restaurant } from './types';

const App: React.FC = () => {
  const [trains, setTrains] = useState<TrainDisplayData[]>([]);
  const [lunchMenus, setLunchMenus] = useState<Restaurant[]>([]);
  const [loadingTrains, setLoadingTrains] = useState(true);
  const [loadingLunch, setLoadingLunch] = useState(true);

  // Initial Data Load
  useEffect(() => {
    const loadTrains = async () => {
      setLoadingTrains(true);
      const data = await fetchTrainData();
      setTrains(data);
      setLoadingTrains(false);
    };

    const loadLunch = async () => {
      setLoadingLunch(true);
      const data = await fetchLunchData();
      setLunchMenus(data);
      setLoadingLunch(false);
    };

    loadTrains();
    loadLunch();

    // Refresh intervals
    const trainInterval = setInterval(async () => {
      const data = await fetchTrainData();
      setTrains(data);
    }, 60000); // 1 minute

    // Refresh page every 30 minutes (legacy requirement)
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 1800000);

    return () => {
      clearInterval(trainInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#333] font-sans flex flex-col">
      <Header />

      <main className="flex-grow max-w-[1920px] mx-auto px-4 md:px-6 space-y-6 w-full pb-6">
        
        {/* Top Section: Map & Trains */}
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[600px]">
          {/* Left: Weather Map */}
          <div className="w-full lg:w-1/2 h-[500px] lg:h-full">
            <WeatherWidget />
          </div>

          {/* Right: Train Table */}
          <div className="w-full lg:w-1/2 h-[500px] lg:h-full">
            <TrainTable data={trains} isLoading={loadingTrains} />
          </div>
        </div>

        {/* Bottom Section: Lunch Slider */}
        <div className="w-full">
          <LunchSlider data={lunchMenus} loading={loadingLunch} />
        </div>

      </main>

      {/* Footer Ticker */}
      <NewsTicker />
    </div>
  );
};

export default App;
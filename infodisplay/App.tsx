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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initial Data Load
  useEffect(() => {
    const loadTrains = async () => {
      setLoadingTrains(true);
      try {
        const data = await fetchTrainData();
        setTrains(data);
        console.log(`Loaded ${data.length} trains`);
      } catch (error) {
        console.error('Failed to load trains:', error);
      } finally {
        setLoadingTrains(false);
      }
    };

    const loadLunch = async () => {
      setLoadingLunch(true);
      try {
        const data = await fetchLunchData();
        setLunchMenus(data);
        console.log(`Loaded ${data.length} lunch menus`);
      } catch (error) {
        console.error('Failed to load lunch data:', error);
      } finally {
        setLoadingLunch(false);
      }
    };

    loadTrains();
    loadLunch();
    setLastUpdate(new Date());

    // Conservative refresh intervals to avoid overloading APIs
    const trainInterval = setInterval(async () => {
      try {
        const data = await fetchTrainData();
        setTrains(data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to refresh trains:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes for trains (they use caching)

    const lunchInterval = setInterval(async () => {
      try {
        const data = await fetchLunchData();
        setLunchMenus(data);
      } catch (error) {
        console.error('Failed to refresh lunch data:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes for lunch (cached on backend)

    // Refresh page every hour instead of 30 minutes to reduce load
    const refreshInterval = setInterval(() => {
      console.log('Refreshing page...');
      window.location.reload();
    }, 3600000); // 1 hour

    return () => {
      clearInterval(trainInterval);
      clearInterval(lunchInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className="h-screen bg-[#f4f4f4] text-[#333] font-sans">
      <Header />

      {/* Main content with fixed height to guarantee ticker space */}
      <div style={{ height: 'calc(100vh - 90px - 56px)' }} className="max-w-[1920px] mx-auto px-5 lg:px-12 xl:px-16 space-y-4 lg:space-y-6 w-full overflow-hidden">
        
        {/* Top Section: Map & Trains */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[540px] lg:h-[500px]">
          {/* Left: Weather Map */}
          <div className="w-full lg:w-[56%] h-full">
            <WeatherWidget />
          </div>

          {/* Right: Train Table */}
          <div className="w-full lg:w-[44%] h-full">
            <TrainTable data={trains} isLoading={loadingTrains} />
          </div>
        </div>

        {/* Bottom Section: Lunch Slider */}
        <div className="w-full h-[150px]">
          <LunchSlider data={lunchMenus} loading={loadingLunch} />
        </div>

      </div>

      {/* Footer Ticker - Always visible at bottom with fixed positioning */}
      <div className="fixed bottom-0 left-0 right-0 h-14 z-50">
        <NewsTicker />
      </div>
    </div>
  );
};

export default App;
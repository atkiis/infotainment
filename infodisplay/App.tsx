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

    const trainInterval = setInterval(async () => {
      const data = await fetchTrainData();
      setTrains(data);
    }, 60000);

    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 1800000);

    return () => {
      clearInterval(trainInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#f4f4f4] text-[#333] font-sans flex justify-center">
      <div className="w-full h-full max-w-[1920px] flex flex-col">
        <Header />

        <main className="flex-1 max-w-[1920px] mx-auto px-4 md:px-6 space-y-6 w-full pb-6 overflow-hidden flex flex-col">
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
            <div className="w-full lg:w-1/2 min-h-[420px] flex">
              <div className="flex-1 min-h-0">
                <WeatherWidget />
              </div>
            </div>

            <div className="w-full lg:w-1/2 min-h-[420px] flex">
              <div className="flex-1 min-h-0">
                <TrainTable data={trains} isLoading={loadingTrains} />
              </div>
            </div>
          </div>

          <div className="w-full flex-none">
            <LunchSlider data={lunchMenus} loading={loadingLunch} />
          </div>
        </main>

        <div className="mt-auto">
          <NewsTicker />
        </div>
      </div>
    </div>
  );
};

export default App;
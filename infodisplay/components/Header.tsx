import React from 'react';
import { Clock } from 'lucide-react';

export const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const saunaIsOn = currentTime.getHours() >= 17 && currentTime.getHours() < 22;
  const saunaTemperature = '79.5°C';

  return (
    <header className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center mb-6 border-b-4 border-[#005f8b]">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#002b45] m-0">
          Lobby <span className="text-[#ffa500]">Tampere</span>
        </h1>
      </div>
      <div className="ml-auto mr-4 flex items-center gap-3 text-sm font-semibold text-[#005f8b]">
        <span
          className={`h-2.5 w-2.5 rounded-full ${saunaIsOn ? 'bg-emerald-500' : 'bg-gray-400'}`}
        />
        <span className="uppercase tracking-wide flex items-center gap-2">
          Sauna {saunaIsOn ? 'On' : 'Off'}
          <span className="flex items-center gap-1 rounded-lg border border-[#005f8b]/30 bg-[#f2faff] px-2 py-1 text-[0.7rem] font-semibold text-[#005f8b]">
            <span className="uppercase tracking-wide text-[#005f8b]/70">Temp</span>
            <span className="text-sm text-[#005f8b]">{saunaTemperature}</span>
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2 text-[#005f8b] font-medium text-xl">
        <Clock className="w-6 h-6" />
        <span>
          {currentTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </header>
  );
};

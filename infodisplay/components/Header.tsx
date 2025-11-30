import React from 'react';
import { Clock } from 'lucide-react';

export const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full bg-white shadow-sm py-2 lg:py-3 px-6 lg:px-10 xl:px-14 flex justify-between items-center mb-3 lg:mb-4 border-b-4 border-[#005f8b]">
      <div className="flex items-center gap-3">
        <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-3xl font-bold text-[#002b45] m-0">
          Lobby <span className="text-[#ffa500]">Tampere</span>
        </h1>
      </div>
      <div className="flex items-center gap-2 lg:gap-3 text-[#005f8b] font-medium text-lg lg:text-xl xl:text-2xl">
        <Clock className="w-5 h-5 lg:w-7 lg:h-7 xl:w-8 xl:h-8" />
        <span>
          {currentTime.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </header>
  );
};

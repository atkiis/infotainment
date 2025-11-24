import React from 'react';
import { Clock } from 'lucide-react';

export const Header: React.FC = () => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center mb-6 border-b-4 border-[#005f8b]">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-[#002b45] m-0">
          Lobby <span className="text-[#ffa500]">Tampere</span>
        </h1>
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

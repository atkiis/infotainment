import React from 'react';
import { Megaphone } from 'lucide-react';

export const NewsTicker: React.FC = () => {
  return (
    <div className="w-full bg-white text-gray-800 h-14 flex items-center overflow-hidden relative border-t-4 border-[#ffa500] shadow-lg">
      
      {/* Label Section - Yellow Background, Dark Text */}
      <div className="bg-[#ffa500] h-full px-6 flex items-center flex-shrink-0">
        <Megaphone className="w-5 h-5 mr-3 text-[#002b45]" />
        <span className="font-bold text-sm uppercase tracking-wider text-[#002b45]">Announcements</span>
      </div>

      {/* Scrolling Content */}
      <div className="flex-1 overflow-hidden h-full flex items-center bg-white">
        <div className="ticker-scroll whitespace-nowrap px-4">
          <span className="text-base font-medium text-gray-800">
            Welcome to Tampere Lobby • Please remember to keep your access badge visible at all times • 
            Bluumo's massage service at the Tampere office 16.12. • IT at the office every month's 3rd Thursday • 
            Have a wonderful and productive day! • 
          </span>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .ticker-scroll {
          animation: ticker 45s linear infinite;
        }
      `}</style>
    </div>
  );
};
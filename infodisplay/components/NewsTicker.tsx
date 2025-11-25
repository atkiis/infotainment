import React from 'react';
import { Megaphone } from 'lucide-react';

export const NewsTicker: React.FC = () => {
  return (
    <div className="w-full bg-white text-gray-800 h-14 flex items-center overflow-hidden relative border-t-4 border-[#ffa500] shadow-[0_-4px_15px_rgba(0,0,0,0.05)] z-30">
      
      {/* Label Section - Yellow Background, Dark Text */}
      <div className="bg-[#ffa500] h-full pl-6 pr-8 flex items-center z-20 relative shrink-0">
        <Megaphone className="w-5 h-5 mr-3 text-[#002b45]" />
        <span className="font-bold text-base uppercase tracking-wider text-[#002b45]">Announcements</span>
        
        {/* Decorative slanted edge */}
        <div className="absolute right-0 top-0 h-full w-8 bg-[#ffa500] transform skew-x-[20deg] origin-bottom-right translate-x-4"></div>
      </div>

      {/* Scrolling Content */}
      <div className="whitespace-nowrap overflow-hidden flex-1 flex items-center h-full ml-8">
        <div className="animate-marquee inline-block pl-full">
           <span className="mx-8 font-medium text-lg">Welcome to Tampere Lobby.</span>
           <span className="mx-2 text-[#ffa500] text-2xl leading-none relative top-[2px]">•</span>
           <span className="mx-8 font-medium text-lg">Please remember to keep your access badge visible at all times.</span>
           <span className="mx-2 text-[#ffa500] text-2xl leading-none relative top-[2px]">•</span>
           <span className="mx-8 font-medium text-lg">Bluumo's massage service at the Tampere office 16.12.</span>
           <span className="mx-2 text-[#ffa500] text-2xl leading-none relative top-[2px]">•</span>
           <span className="mx-8 font-medium text-lg">IT at the office every months 3rd Thursday</span>
           <span className="mx-2 text-[#ffa500] text-2xl leading-none relative top-[2px]">•</span>
           <span className="mx-8 font-medium text-lg">Have a wonderful and productive day!</span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 45s linear infinite;
        }
      `}</style>
    </div>
  );
};
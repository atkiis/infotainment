import React, { useEffect, useRef, useState } from 'react';
import { TrainDisplayData } from '../types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface TrainTableProps {
  data: TrainDisplayData[];
  isLoading: boolean;
}

export const TrainTable: React.FC<TrainTableProps> = ({ data, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(true);

  // Auto-scroll logic
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !isScrolling) return;

    let animationFrameId: number;
    let scrollAmount = 0;
    const speed = 0.5; // Pixels per frame

    const scroll = () => {
      if (!scrollContainer) return;
      
      scrollAmount += speed;
      if (scrollAmount >= 1) {
        scrollContainer.scrollTop += 1;
        scrollAmount = 0;
      }

      // Check if reached bottom
      if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 1) {
        // Reset to top
        scrollContainer.scrollTop = 0;
      }

      animationFrameId = requestAnimationFrame(scroll);
    };

    // Only start scrolling if content overflows
    if (scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        // Delay start slightly
        setTimeout(() => {
            animationFrameId = requestAnimationFrame(scroll);
        }, 2000);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [data, isScrolling]);

  if (isLoading && data.length === 0) {
    return (
      <div className="w-full h-full bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005f8b]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-white z-10">
        <h2 className="text-xl font-semibold text-[#005f8b] border-b-2 border-[#ffa500] inline-block pb-1">
          🚆 Tampere Train Arrivals & Departures
        </h2>
      </div>
      
      {/* Header - Fixed */}
      <div className="bg-[#f8f9fa] text-[#002b45] border-b border-gray-200 z-10 shadow-sm">
        <table className="w-full text-left text-sm text-[#333] table-fixed">
          <thead>
            <tr>
              <th className="p-3 font-bold w-[15%]">Train</th>
              <th className="p-3 font-bold w-[10%] text-center">Track</th>
              <th className="p-3 font-bold w-[25%]">Destination</th>
              <th className="p-3 font-bold w-[25%]">Arrival</th>
              <th className="p-3 font-bold w-[25%]">Departure</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable Body */}
      <div 
        ref={scrollRef} 
        className="flex-grow overflow-y-auto relative bg-white scrollbar-hide"
        onMouseEnter={() => setIsScrolling(false)} // Pause on hover
        onMouseLeave={() => setIsScrolling(true)}
      >
        <table className="w-full text-left text-sm text-[#333] table-fixed">
          <tbody className="divide-y divide-gray-100">
            {data.map((train) => (
              <tr key={train.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-medium w-[15%] truncate">{train.trainNumber}</td>
                <td className="p-3 text-center font-bold text-[#005f8b] w-[10%]">{train.track}</td>
                <td className="p-3 w-[25%] truncate">{train.destination}</td>
                <td className="p-3 w-[25%]">
                   <StatusBadge data={train.arrival} />
                </td>
                <td className="p-3 w-[25%]">
                    <StatusBadge data={train.departure} />
                </td>
              </tr>
            ))}
            {data.length === 0 && !isLoading && (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">No passenger trains found within current timeframe.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ data: { time: string; isLate: boolean; status: string } }> = ({ data }) => {
  if (data.time === '-') return <span className="text-gray-300">-</span>;

  return (
    <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5">
            {data.isLate ? (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
            <span className="font-medium">{data.time}</span>
        </div>
        {data.isLate && (
             <span className="text-xs text-red-600 font-semibold bg-red-50 px-1.5 rounded">
                {data.status}
             </span>
        )}
    </div>
  );
};
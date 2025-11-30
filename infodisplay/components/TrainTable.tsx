import React, { useEffect, useMemo, useState } from 'react';
import { TrainDisplayData } from '../types';
import { AlertCircle, CheckCircle2, Train } from 'lucide-react';

interface TrainTableProps {
  data: TrainDisplayData[];
  isLoading: boolean;
}

export const TrainTable: React.FC<TrainTableProps> = ({ data, isLoading }) => {
  const PAGE_SIZE = 6;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(0);
    }
  }, [page, totalPages]);

  const pagedData = useMemo(() => {
    const start = page * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [data, page]);

  const startIndex = data.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const endIndex = data.length === 0 ? 0 : Math.min(data.length, (page + 1) * PAGE_SIZE);

  const handlePrev = () => setPage((prev) => (prev - 1 + totalPages) % totalPages);
  const handleNext = () => setPage((prev) => (prev + 1) % totalPages);

  if (isLoading && data.length === 0) {
    return (
      <div className="w-full h-full bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005f8b]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden relative">
      <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center z-[401] bg-white/95 backdrop-blur-sm absolute top-0 w-full shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="bg-sky-100 p-1 rounded-lg text-sky-700">
            <Train className="w-4 h-4" />
          </div>
          <h2 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">Tampere Train Arrivals & Departures</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handlePrev}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-[#005f8b] hover:bg-[#005f8b] hover:text-white transition-colors"
            aria-label="Previous trains"
          >
            &#8592;
          </button>
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Page {page + 1} / {totalPages}</span>
          <button
            onClick={handleNext}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-[#005f8b] hover:bg-[#005f8b] hover:text-white transition-colors"
            aria-label="Next trains"
          >
            &#8594;
          </button>
        </div>
      </div>
      
      {/* Header - Fixed */}
      <div className="bg-[#f8f9fa] text-[#002b45] border-b border-gray-200 z-10 shadow-sm mt-14">
        <table className="w-full text-left text-base text-[#333] table-fixed">
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
      <div className="flex-grow relative bg-white">
        <table className="w-full text-left text-base text-[#333] table-fixed">
          <tbody className="divide-y divide-gray-100">
            {pagedData.map((train) => (
              <tr key={train.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-medium w-[15%] truncate">{train.trainNumber}</td>
                <td className="p-3 text-center font-bold text-[#005f8b] w-[10%] text-lg">{train.track}</td>
                <td className="p-3 w-[25%] truncate">{train.destination}</td>
                <td className="p-3 w-[25%]">
                   <StatusBadge data={train.arrival} />
                </td>
                <td className="p-3 w-[25%]">
                    <StatusBadge data={train.departure} />
                </td>
              </tr>
            ))}
            {pagedData.length === 0 && !isLoading && (
                <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">No passenger trains found within current timeframe.</td>
                </tr>
            )}
          </tbody>
        </table>
        {data.length > 0 && (
          <div className="absolute bottom-2 right-4 text-xs text-gray-400">
            Showing {startIndex}-{endIndex} of {data.length}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ data: { time: string; isLate: boolean; status: string } }> = ({ data }) => {
  if (data.time === '-') return <span className="text-gray-300">-</span>;

  return (
    <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
            {data.isLate ? (
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
            <span className="font-medium">{data.time}</span>
        </div>
        {data.isLate && (
             <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
                {data.status}
             </span>
        )}
    </div>
  );
};
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Restaurant } from '../types';
import { ChevronLeft, ChevronRight, Utensils } from 'lucide-react';

interface LunchSliderProps {
  data: Restaurant[];
  loading: boolean;
}

export const LunchSlider: React.FC<LunchSliderProps> = ({ data, loading }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const itemsPerView = 3;
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Prepare Data: Clone the first few items to the end to create the "infinite" buffer.
  // This ensures that when we slide past the last real item, we see the start items instead of empty space.
  const extendedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Only clone if we have enough items, otherwise duplicate the whole list to fill space
    const clonesNeeded = itemsPerView;
    const clones = data.slice(0, clonesNeeded);
    return [...data, ...clones];
  }, [data]);

  const totalRealSlides = data.length;

  // 2. Reset logic when data loads
  useEffect(() => {
    setActiveIndex(0);
    setIsTransitioning(true);
  }, [data.length]);

  // 3. Auto Play Management
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [activeIndex, totalRealSlides]);

  // 4. The "Infinite" Magic: Snap back logic
  useEffect(() => {
    // If we have slid fully into the clone zone (visual equivalent of index 0)
    if (activeIndex === totalRealSlides) {
      // Wait for the slide animation to finish (700ms matches CSS), then snap back instantly
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false); // Disable animation for the snap
        setActiveIndex(0); // Jump to real start
        
        // Re-enable animation for the next normal slide
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsTransitioning(true);
            });
        });
      }, 700);
    }
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [activeIndex, totalRealSlides]);

  const startAutoPlay = () => {
    stopAutoPlay();
    if (data.length > itemsPerView) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, 6000);
    }
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  const nextSlide = () => {
    // We allow going up to totalRealSlides (which shows the clones)
    if (activeIndex < totalRealSlides) {
      setActiveIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    } else {
      // Infinite backward loop: Snap to the end (clones) then animate to last real item
      setIsTransitioning(false);
      setActiveIndex(totalRealSlides);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setActiveIndex(totalRealSlides - 1);
        });
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-lg p-8 text-center text-gray-400">
        Loading Lunch Menus...
      </div>
    );
  }

  if (!extendedData.length) return null;

  // Calculate translation percentage
  // Each item is 33.333% of the view. We shift by (100/3)% per index.
  const translateX = -(activeIndex * (100 / itemsPerView));

  return (
    <div 
      className="w-full bg-white rounded-xl shadow-lg p-6 relative group overflow-hidden"
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2 relative z-10 bg-white">
        <h2 className="text-xl font-semibold text-[#005f8b] border-b-2 border-[#ffa500] inline-block pb-1 flex items-center gap-2">
          <Utensils className="w-5 h-5" /> Lunch Menus
        </h2>
        
        <div className="flex gap-2">
          <button 
            onClick={prevSlide}
            className="p-2 rounded-full bg-gray-100 hover:bg-[#005f8b] hover:text-white transition-colors text-[#005f8b]"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextSlide}
            className="p-2 rounded-full bg-gray-100 hover:bg-[#005f8b] hover:text-white transition-colors text-[#005f8b]"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Track Wrapper */}
      <div className="w-full overflow-hidden">
        <div 
          className="flex w-full"
          style={{ 
            transform: `translateX(${translateX}%)`,
            transition: isTransitioning ? 'transform 700ms ease-in-out' : 'none'
          }}
        >
          {extendedData.map((restaurant, idx) => (
            // Item Wrapper: strictly 33.333% width to ensure 3 items fit perfectly
            <div 
              key={`${restaurant.restaurant}-${idx}`} 
              className="flex-shrink-0 px-2 box-border w-1/3"
            >
              <div className="h-full bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-[#005f8b]/30 transition-colors flex flex-col min-h-[300px]">
                <h3 className="text-lg font-bold text-[#002b45] mb-3 min-h-[3.5rem] line-clamp-2 border-b border-gray-200 pb-2">
                  {restaurant.restaurant}
                </h3>
                
                <div className="flex-grow">
                  {restaurant.error ? (
                    <p className="text-red-500 text-sm">{restaurant.error}</p>
                  ) : (
                    <div className="space-y-3">
                      {restaurant.menu.map((day, dIdx) => (
                        <div key={dIdx}>
                          <h4 className="text-xs font-bold text-[#ffa500] uppercase tracking-wider mb-2">{day.date}</h4>
                          <ul className="space-y-2">
                            {day.menu && day.menu.length > 0 ? (
                              day.menu.map((item, iIdx) => (
                                <li key={iIdx} className="text-sm text-gray-700 pb-2 border-b border-gray-200 last:border-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="font-medium text-gray-800 leading-tight">{item.dish}</span>
                                    <span className="text-[#005f8b] font-bold whitespace-nowrap text-sm">{item.price}</span>
                                  </div>
                                  {item.info && <span className="text-xs text-gray-400 italic block mt-0.5">{item.info}</span>}
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-500 italic">Menu updating...</li>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

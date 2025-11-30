import { Train, TrainDisplayData, TimeTableRow } from '../types';
import { getFullStationName, formatTime } from './stationUtils';

const API_URL = "https://rata.digitraffic.fi/api/v1/live-trains/station/TPE?minutes_before_departure=30&minutes_after_departure=10&minutes_before_arrival=30&minutes_after_arrival=15";

// Simple cache to reduce API calls
interface TrainCache {
  data: TrainDisplayData[];
  timestamp: number;
  expiresAt: number;
}

class TrainDataCache {
  private cache: TrainCache | null = null;
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
  private requestInProgress = false;

  isValid(): boolean {
    return this.cache !== null && Date.now() < this.cache.expiresAt;
  }

  setData(data: TrainDisplayData[]): void {
    const now = Date.now();
    this.cache = {
      data,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    };
  }

  getData(): TrainDisplayData[] | null {
    return this.cache?.data || null;
  }

  getRequestInProgress(): boolean {
    return this.requestInProgress;
  }

  setRequestInProgress(inProgress: boolean): void {
    this.requestInProgress = inProgress;
  }
}

const trainCache = new TrainDataCache();

export const fetchTrainData = async (): Promise<TrainDisplayData[]> => {
  // Return cached data if still valid
  if (trainCache.isValid()) {
    console.log('Returning cached train data');
    return trainCache.getData() || [];
  }

  // Prevent multiple simultaneous requests
  if (trainCache.getRequestInProgress()) {
    console.log('Train request already in progress, returning stale cache');
    return trainCache.getData() || [];
  }

  try {
    trainCache.setRequestInProgress(true);
    console.log('Fetching fresh train data...');
    
    const response = await fetch(API_URL, {
      headers: {
        'User-Agent': 'TampereInfoDisplay/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const rawData: Train[] = await response.json();

    // Filter for passenger trains only (Long-distance and Commuter)
    const passengerTrains = rawData.filter(train => 
        train.trainCategory === "Long-distance" || train.trainCategory === "Commuter"
    );

    // Sort by departure time
    const sortedData = passengerTrains.sort((a, b) => {
      const aDep = getTrainDepartureTimeRaw(a);
      const bDep = getTrainDepartureTimeRaw(b);
      return aDep - bDep;
    });

    const processedData = sortedData.map(processTrain);
    
    // Cache the results
    trainCache.setData(processedData);
    console.log(`Successfully cached ${processedData.length} trains`);
    
    return processedData;
    
  } catch (error: any) {
    console.error("Error fetching train data:", error.message);
    
    // Return stale cache if available
    const cachedData = trainCache.getData();
    if (cachedData) {
      console.log('Returning stale train cache due to error');
      return cachedData;
    }
    
    return [];
  } finally {
    trainCache.setRequestInProgress(false);
  }
};

const getTrainDepartureTimeRaw = (train: Train): number => {
  const departureRow = train.timeTableRows.find(row => row.stationShortCode === "TPE" && row.type === "DEPARTURE");
  return departureRow ? new Date(departureRow.scheduledTime).getTime() : Infinity;
};

const processTrain = (train: Train): TrainDisplayData => {
  const destShortCode = train.timeTableRows[train.timeTableRows.length - 1]?.stationShortCode;
  
  return {
    id: `${train.trainNumber}-${train.departureDate}`,
    trainNumber: `${train.trainType} ${train.trainNumber}`,
    track: getDepartureTrack(train),
    destination: getFullStationName(destShortCode),
    arrival: getTrainTimeStatus(train, 'ARRIVAL'),
    departure: getTrainTimeStatus(train, 'DEPARTURE'),
    category: train.trainCategory,
  };
};

const getDepartureTrack = (train: Train): string => {
  const row = train.timeTableRows.find(r => r.stationShortCode === "TPE" && r.type === "DEPARTURE");
  return row ? row.commercialTrack || "N/A" : "N/A";
};

const getTrainTimeStatus = (train: Train, type: "ARRIVAL" | "DEPARTURE") => {
  const row = train.timeTableRows.find(r => r.stationShortCode === "TPE" && r.type === type);
  
  if (!row) {
    return { time: "-", status: "", isLate: false, delayMinutes: 0 };
  }

  const scheduled = new Date(row.scheduledTime);
  const actual = row.actualTime ? new Date(row.actualTime) : null;
  const formattedTime = formatTime(row.scheduledTime);

  if (!actual || actual <= scheduled) {
    return { time: formattedTime, status: "On Time", isLate: false, delayMinutes: 0 };
  } else {
    const delayMinutes = Math.round((actual.getTime() - scheduled.getTime()) / 60000);
    const isLate = delayMinutes > 0;
    // Strict formatting as requested
    return { 
      time: formattedTime, 
      status: isLate ? `(+${delayMinutes} minutes late)` : "On Time", 
      isLate, 
      delayMinutes 
    };
  }
};
import { Train, TrainDisplayData, TimeTableRow } from '../types';
import { getFullStationName, formatTime } from './stationUtils';

const API_URL = "https://rata.digitraffic.fi/api/v1/live-trains/station/TPE?minutes_before_departure=60&minutes_after_departure=10&minutes_before_arrival=60&minutes_after_arrival=15";

export const fetchTrainData = async (): Promise<TrainDisplayData[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
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

    return sortedData.map(processTrain);
  } catch (error) {
    console.error("Error fetching train data:", error);
    return [];
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
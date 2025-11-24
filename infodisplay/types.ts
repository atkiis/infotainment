export interface TimeTableRow {
  stationShortCode: string;
  stationUICCode: number;
  countryCode: string;
  type: "ARRIVAL" | "DEPARTURE";
  trainStopping: boolean;
  commercialStop: boolean;
  commercialTrack: string;
  cancelled: boolean;
  scheduledTime: string;
  actualTime?: string;
  differenceInMinutes?: number;
  liveEstimateTime?: string;
  estimateSource?: string;
}

export interface Train {
  trainNumber: number;
  departureDate: string;
  operatorUICCode: number;
  operatorShortCode: string;
  trainType: string;
  trainCategory: string;
  commuterLineID: string;
  runningCurrently: boolean;
  cancelled: boolean;
  version: number;
  timetableType: string;
  timeTableRows: TimeTableRow[];
}

export interface TrainDisplayData {
  id: string;
  trainNumber: string;
  track: string;
  destination: string;
  arrival: {
    time: string;
    status: string;
    isLate: boolean;
    delayMinutes: number;
  };
  departure: {
    time: string;
    status: string;
    isLate: boolean;
    delayMinutes: number;
  };
  category: string;
}

export interface MenuItem {
  dish: string;
  price: string;
  info: string;
}

export interface MenuDay {
  date: string;
  menu?: MenuItem[];
  message?: string;
}

export interface Restaurant {
  restaurant: string;
  menu: MenuDay[];
  error?: string;
}

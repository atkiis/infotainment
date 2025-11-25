import { Restaurant } from "../types";

export const fetchLunchData = async (): Promise<Restaurant[]> => {
  const response = await fetch("/lunch");
  if (!response.ok) {
    throw new Error("Failed to fetch lunch data");
  }
  const data: Restaurant[] = await response.json();
  return data;
};

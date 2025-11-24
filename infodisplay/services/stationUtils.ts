export const getFullStationName = (shortCode: string): string => {
  const stationNames: Record<string, string> = {
    "HKI": "Helsinki",
    "TPE": "Tampere",
    "JY": "Jyväskylä",
    "TKU": "Turku",
    "OL": "Oulu",
    "RVS": "Rovaniemi",
    "LHI": "Lahti",
    "SEI": "Seinäjoki",
    "KPO": "Kuopio",
    "PSL": "Pasila",
    "VRL": "Varkaus",
    "VS": "Vaasa",
    "NOA": "Nokia",
    "HL": "Hämeenlinna",
    "TL": "Toijala",
    "ROI": "Rovaniemi",
    "PRI": "Pori",
    "PM": "Pieksämäki",
    "JNS": "Joensuu",
    "KAJ": "Kajaani",
    "KEM": "Kemi",
    "KOK": "Kokkola",
  };
  return stationNames[shortCode] || shortCode;
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("fi-FI", { hour: '2-digit', minute: '2-digit' });
};

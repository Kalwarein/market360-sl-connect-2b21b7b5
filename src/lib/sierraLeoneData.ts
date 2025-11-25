// Sierra Leone location data for district and region selection

export const SIERRA_LEONE_REGIONS = [
  'Eastern',
  'Northern', 
  'Southern',
  'Western'
] as const;

export const SIERRA_LEONE_DISTRICTS: Record<typeof SIERRA_LEONE_REGIONS[number], string[]> = {
  'Eastern': [
    'Kailahun',
    'Kenema',
    'Kono'
  ],
  'Northern': [
    'Bombali',
    'Falaba',
    'Koinadugu',
    'Kambia',
    'Karene',
    'Tonkolili'
  ],
  'Southern': [
    'Bo',
    'Bonthe',
    'Moyamba',
    'Pujehun'
  ],
  'Western': [
    'Freetown',
    'Western Area Rural',
    'Western Area Urban'
  ]
};

export const getAllDistricts = (): string[] => {
  return Object.values(SIERRA_LEONE_DISTRICTS).flat();
};

export const getDistrictsByRegion = (region: typeof SIERRA_LEONE_REGIONS[number]): string[] => {
  return SIERRA_LEONE_DISTRICTS[region] || [];
};

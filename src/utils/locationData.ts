import { Country, State, City } from 'country-state-city';

export interface LocationOption {
  value: string;
  label: string;
  code?: string;
}

export interface StateOption extends LocationOption {
  countryCode: string;
}

export interface CityOption extends LocationOption {
  stateCode: string;
  countryCode: string;
}

// Get India country data
export const getIndiaCountry = () => {
  return Country.getCountryByCode('IN');
};

// Get all Indian states
export const getIndianStates = (): StateOption[] => {
  const states = State.getStatesOfCountry('IN');
  return states
    .map((state) => ({
      value: state.name,
      label: state.name,
      code: state.isoCode,
      countryCode: 'IN',
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Get cities of a specific Indian state
export const getIndianCities = (stateCode: string): CityOption[] => {
  const cities = City.getCitiesOfState('IN', stateCode);
  return cities
    .map((city) => ({
      value: city.name,
      label: city.name,
      stateCode: stateCode,
      countryCode: 'IN',
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

// Get major Indian cities (for quick selection)
export const getMajorIndianCities = (): string[] => {
  return [
    'Mumbai',
    'Delhi',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Surat',
    'Jaipur',
    'Lucknow',
    'Kanpur',
    'Nagpur',
    'Indore',
    'Thane',
    'Bhopal',
    'Visakhapatnam',
    'Pimpri-Chinchwad',
    'Patna',
    'Vadodara',
    'Ghaziabad',
    'Ludhiana',
    'Agra',
    'Nashik',
    'Faridabad',
    'Meerut',
    'Rajkot',
    'Kalyan-Dombivali',
    'Vasai-Virar',
    'Varanasi',
    'Srinagar',
    'Aurangabad',
    'Dhanbad',
    'Amritsar',
    'Navi Mumbai',
    'Allahabad',
    'Ranchi',
    'Howrah',
    'Coimbatore',
    'Jabalpur',
    'Gwalior',
    'Vijayawada',
    'Jodhpur',
    'Madurai',
    'Raipur',
    'Kota',
    'Guwahati',
    'Chandigarh',
    'Solapur',
  ].sort();
};

// Enhanced regions with state-wise breakdown
export const getIndianRegions = () => {
  return [
    { value: 'All India', label: 'All India', description: 'Pan-India coverage' },
    {
      value: 'North India',
      label: 'North India',
      description: 'Delhi, Punjab, Haryana, UP, Uttarakhand, HP, J&K',
    },
    {
      value: 'South India',
      label: 'South India',
      description: 'Karnataka, Tamil Nadu, Andhra Pradesh, Telangana, Kerala',
    },
    {
      value: 'West India',
      label: 'West India',
      description: 'Maharashtra, Gujarat, Rajasthan, Goa',
    },
    {
      value: 'East India',
      label: 'East India',
      description: 'West Bengal, Odisha, Jharkhand, Bihar',
    },
    { value: 'Central India', label: 'Central India', description: 'Madhya Pradesh, Chhattisgarh' },
    {
      value: 'Northeast India',
      label: 'Northeast India',
      description:
        'Assam, Meghalaya, Manipur, Mizoram, Tripura, Nagaland, Arunachal Pradesh, Sikkim',
    },

    // Major metropolitan areas
    {
      value: 'Mumbai Metropolitan',
      label: 'Mumbai Metropolitan Region',
      description: 'Mumbai, Navi Mumbai, Thane, Kalyan-Dombivali',
    },
    {
      value: 'Delhi NCR',
      label: 'Delhi NCR',
      description: 'Delhi, Gurgaon, Noida, Faridabad, Ghaziabad',
    },
    {
      value: 'Bangalore Urban',
      label: 'Bangalore Urban',
      description: 'Bangalore and surrounding areas',
    },
    {
      value: 'Chennai Metropolitan',
      label: 'Chennai Metropolitan',
      description: 'Chennai and surrounding areas',
    },
    {
      value: 'Hyderabad Metropolitan',
      label: 'Hyderabad Metropolitan',
      description: 'Hyderabad, Secunderabad and surrounding areas',
    },
    {
      value: 'Pune Metropolitan',
      label: 'Pune Metropolitan',
      description: 'Pune, Pimpri-Chinchwad and surrounding areas',
    },
    {
      value: 'Kolkata Metropolitan',
      label: 'Kolkata Metropolitan',
      description: 'Kolkata, Howrah and surrounding areas',
    },
    {
      value: 'Ahmedabad Metropolitan',
      label: 'Ahmedabad Metropolitan',
      description: 'Ahmedabad and surrounding areas',
    },
  ];
};

// Function to get state code by state name
export const getStateCodeByName = (stateName: string): string | null => {
  const states = getIndianStates();
  const state = states.find((s) => s.value.toLowerCase() === stateName.toLowerCase());
  return state?.code || null;
};

// Function to search cities across all states
export const searchIndianCities = (searchTerm: string, limit: number = 20): CityOption[] => {
  const allCities: CityOption[] = [];
  const states = getIndianStates();

  for (const state of states) {
    if (state.code) {
      const cities = getIndianCities(state.code);
      allCities.push(...cities);
    }
  }

  return allCities
    .filter((city) => city.label.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, limit)
    .sort((a, b) => a.label.localeCompare(b.label));
};

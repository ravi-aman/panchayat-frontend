import { Company } from '../types/company';

/**
 * Gets company data from either React Router state or sessionStorage fallback
 *
 * @param locationState - The state object from React Router's useLocation
 * @returns The company data or null
 */
export const getCompanyData = (
  locationState: { company?: Company } | null | undefined,
): Company | null => {
  // Try to get company from location state first
  if (locationState?.company) {
    return locationState.company;
  }

  // If not in location state, try sessionStorage
  try {
    const storedCompany = sessionStorage.getItem('currentCompany');
    if (storedCompany) {
      return JSON.parse(storedCompany);
    }
  } catch (error) {
    console.error('Error getting company from sessionStorage', error);
  }

  return null;
};

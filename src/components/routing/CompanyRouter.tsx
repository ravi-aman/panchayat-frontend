import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StartupDetails from '../../pages/dashboardPages/startups/StartupDetails.tsx';
import MsmeDetails from '../../pages/dashboardPages/msme/MsmeDetails.tsx';
import { Company } from '../../types/company';
import { motion } from 'framer-motion';

interface ApiResponse {
  status: string;
  company: Company;
}

/**
 * CompanyRouter component
 *
 * This component decides which details component to render based on the company type.
 * It first fetches company data using the slug/username, then renders either
 * StartupDetails or MsmeDetails based on the company.type property.
 */
const CompanyRouter: React.FC = () => {
  // Get params from any possible route
  const params = useParams<{ username?: string; slug?: string; id?: string }>();
  const { username, slug, id } = params;

  // Use any available identifier (username is preferred)
  const companyIdentifier = username || slug || id;

  const navigate = useNavigate();
  const { state } = useLocation();

  const [company, setCompany] = useState<Company | null>(state?.company || null);
  const [loading, setLoading] = useState(!state?.company);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!companyIdentifier) {
      navigate('/404', { replace: true });
      return;
    }

    // If we already have company data from state, use it
    if (state?.company) {
      return;
    }

    const fetchCompanyDetails = async () => {
      setLoading(true);
      try {
        // Try multiple endpoints to find the company data
        // First try the profile username endpoint (most direct)
        try {
          const profileResponse = await axios.get<ApiResponse>(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/profile/username/${companyIdentifier}`,
          );

          if (profileResponse.data.status === 'success' && profileResponse.data.company) {
            setCompany(profileResponse.data.company);
            setLoading(false);
            return;
          }
        } catch {
          console.log('Profile lookup failed, trying company endpoints...');
        }

        // Then try startup endpoint with slug
        try {
          const startupResponse = await axios.get<ApiResponse>(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/startup/slug/${companyIdentifier}?includeAnalytics=true`,
          );

          if (startupResponse.data.status === 'success' && startupResponse.data.company) {
            setCompany(startupResponse.data.company);
            setLoading(false);
            return;
          }
        } catch {
          console.log('Startup lookup failed, trying MSME endpoint...');
        }

        // Finally try MSME endpoint
        try {
          const msmeResponse = await axios.get<ApiResponse>(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/msme/slug/${companyIdentifier}`,
          );

          if (msmeResponse.data.status === 'success' && msmeResponse.data.company) {
            setCompany(msmeResponse.data.company);
            setLoading(false);
            return;
          }
        } catch {
          console.log('MSME lookup failed');
        }

        // If we get here, we couldn't find the company
        setError('Company not found');
      } catch (error) {
        console.error('Error fetching company details:', error);
        setError('Failed to load company details');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [companyIdentifier, navigate, state?.company]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent"
        />
        <p className="mt-6 text-lg font-medium text-gray-600">Loading company details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-screen">
        <div className="flex items-center justify-center w-16 h-16 mb-4 text-red-500 bg-red-100 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="mb-4 text-lg font-medium text-gray-800">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-screen">
        <p className="mb-4 text-lg font-medium text-gray-600">Company not found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  // To pass data to the child components
  // Since the issue is that direct URL access doesn't have company data in state,
  // we'll make our own wrapper component with the company data explicitly passed as props

  // Create wrapper components that will pass the company data as props
  const MsmeDetailsWrapper = () => {
    return <MsmeDetails />;
  };

  const StartupDetailsWrapper = () => {
    return <StartupDetails />;
  };

  // Set the company data in sessionStorage, which both details components can access
  sessionStorage.setItem('currentCompany', JSON.stringify(company));

  // Return the appropriate component based on company type
  if (company.type === 'msme') {
    return <MsmeDetailsWrapper />;
  }

  // Default to StartupDetails for any other company type (startup, etc.)
  return <StartupDetailsWrapper />;
};

export default CompanyRouter;

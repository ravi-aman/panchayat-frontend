import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import {
  CompanyHeader,
  CompanyAboutSection,
  PostsSection,
  ConnectSidebar,
  ProfileResponse,
} from '../../../components/profile';
import { connectionService, ConnectionSuggestion } from '../../../components/connections';
import { IPost } from '../../../types/postTypes';

const CompanyProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, activeProfile } = useAuth();
  const navigate = useNavigate();
  const [fetchedProfile, setFetchedProfile] = useState<ProfileResponse['profile'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkSuggestions, setNetworkSuggestions] = useState<ConnectionSuggestion[]>([]);

  if (!username) {
    // Navigate to NotFound page if no username is provided
    React.useEffect(() => {
      navigate('/profile-not-found');
    }, [navigate]);

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get<ProfileResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/profile/${username}`,
        );

        if (response.data.status === 'success') {
          setFetchedProfile(response.data.profile);
          console.log('Fetched Profile:', response.data.profile);
        } else {
          throw new Error('Failed to fetch profile data');
        }
      } catch (err) {
        // Check if it's a 404 error
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          navigate('/profile-not-found');
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username, navigate]);

  // If we have a username but no profile was found and we're not loading, navigate to NotFound
  if (fetchedProfile?.type === 'user') {
    React.useEffect(() => {
      navigate('/profile-not-found');
    }, [navigate]);

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }
  if (username && !fetchedProfile && !loading && !error) {
    React.useEffect(() => {
      navigate('/profile-not-found');
    }, [navigate]);

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchNetworkSuggestions = async () => {
      try {
        const suggestions = await connectionService.fetchMutualConnections(1, 10);
        setNetworkSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching network suggestions:', error);
      }
    };

    fetchNetworkSuggestions();
  }, [user?._id]);

  // Get posts from fetched profile data only
  const profilePosts: IPost[] = [];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Profile Header */}
            <CompanyHeader profileData={fetchedProfile} activeProfileId={activeProfile?._id} />

            {/* About Section */}
            <CompanyAboutSection profileData={fetchedProfile} />

            {/* Posts Section */}
            <PostsSection posts={profilePosts} profileData={fetchedProfile} />
          </div>

          {/* Sidebar */}
          <ConnectSidebar networkSuggestions={networkSuggestions} navigate={navigate} />
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;

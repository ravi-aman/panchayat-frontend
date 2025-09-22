import React from 'react';
import { Calendar } from 'lucide-react';
import { ProfileResponse } from './types';

interface AboutSectionProps {
  profileData: ProfileResponse['profile'] | null;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ profileData }) => {
  if (!profileData) return null;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        About {`${profileData.user.firstName}`.trim() || 'User'}
      </h2>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="w-6 h-6 text-blue-500" />
            <span className="text-gray-400 h-[25px] font-semibold text-sm">
              Joined{' '}
              {profileData.createdAt
                ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'January 2023'}
            </span>
          </div>
          <h3 className="font-medium text-gray-900">Bio</h3>
          <p className="mt-1 text-gray-600">{profileData.bio || 'no bio available'}</p>

          {/* Company-specific information */}
          {/* {profileData.type === "Company" && (
            <div className="mt-4 space-y-2">
              {profileData.user.industry && (
                <div>
                  <h4 className="font-medium text-gray-900">Industry</h4>
                  <p className="text-gray-600">{profileData.user.industry}</p>
                </div>
              )}
              {profileData.user.city && (
                <div>
                  <h4 className="font-medium text-gray-900">Location</h4>
                  <p className="text-gray-600">{profileData.user.city}</p>
                </div>
              )}
              {profileData.user.companySize && (
                <div>
                  <h4 className="font-medium text-gray-900">Company Size</h4>
                  <p className="text-gray-600">
                    {profileData.user.companySize}
                  </p>
                </div>
              )}
              {profileData.user.website && (
                <div>
                  <h4 className="font-medium text-gray-900">Website</h4>
                  <a
                    href={profileData.user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profileData.user.website}
                  </a>
                </div>
              )}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { StartupRegisterFormData } from '../../../types/company';

interface ReviewSubmitProps {
  formData: StartupRegisterFormData;
  handleSubmit: () => void;
  loading?: boolean;
}

const ReviewSubmit: React.FC<ReviewSubmitProps> = ({ formData, handleSubmit, loading }) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div>
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Review & Submit</h2>
        <p className="mt-2 text-sm text-gray-600">
          Please review all details carefully before submitting your startup registration.
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Startup Name */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-md">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Startup Name</h3>
          <p className="text-gray-700">{formData.name || 'Not Provided'}</p>
        </div>

        {/* Registered Entity & Tagline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
              Registered Entity
            </h3>
            <p className="text-gray-700">{formData.registeredEntity || 'Not Provided'}</p>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Tagline</h3>
            <p className="text-gray-700">{formData.tagline || 'Not Provided'}</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-md">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700">{formData.description || 'Not Provided'}</p>
        </div>

        {/* Industry & Company Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Industry</h3>
            <p className="text-gray-700">{formData.industry || 'Not Provided'}</p>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Company Size</h3>
            <p className="text-gray-700">{formData.companySize || 'Not Provided'}</p>
          </div>
        </div>

        {/* City & State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">City</h3>
            <p className="text-gray-700">{formData.city || 'Not Provided'}</p>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">State</h3>
            <p className="text-gray-700">{formData.state || 'Not Provided'}</p>
          </div>
        </div>

        {/* Country & Stage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Country</h3>
            <p className="text-gray-700">{formData.country || 'Not Provided'}</p>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Stage</h3>
            <p className="text-gray-700">{formData.stage || 'Not Provided'}</p>
          </div>
        </div>

        {/* Established Year & Funded Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
              Established Year
            </h3>
            <p className="text-gray-700">{formData.establishedYear || 'Not Provided'}</p>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Funded Type</h3>
            <p className="text-gray-700">{formData.fundedType || 'Not Provided'}</p>
          </div>
        </div>

        {/* Website */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-md">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Website</h3>
          {formData.website ? (
            <a
              href={formData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {formData.website}
            </a>
          ) : (
            <p className="text-gray-700">Not Provided</p>
          )}
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-700">{formData.phone || 'Not Provided'}</p>
          </div>
          <div className="bg-gray-50 p-3 md:p-4 rounded-md">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-700">{formData.email || 'Not Provided'}</p>
          </div>
        </div>

        {/* Super Admin */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-md">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Super Admin</h3>
          <p className="text-gray-700">{formData.superAdmin || 'Not Provided'}</p>
        </div>

        {/* Media - Logo and Banner */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-md">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Media</h3>

          {/* Logo */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Logo</h4>
            {formData.logo ? (
              <div className="flex justify-center">
                <img
                  src={formData.logo}
                  alt="Company Logo"
                  className="w-32 h-32 object-contain border-2 border-gray-200 rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/128x128?text=Logo';
                  }}
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-gray-100 rounded-md flex items-center justify-center border-1 border-red-200">
                  <span className="text-red-500 text-sm font-medium">No Logo</span>
                </div>
              </div>
            )}
          </div>

          {/* Banner */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Banner</h4>
            {formData.banner ? (
              <img
                src={formData.banner}
                alt="Company Banner"
                className="w-full h-24 object-cover rounded-md border-2 border-gray-200"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/800x96?text=Banner';
                }}
              />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded-md flex items-center justify-center border-1 border-red-200">
                <span className="text-red-500 text-sm font-medium">No Banner</span>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-gray-50 p-3 md:p-4 rounded-md">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Social Links</h3>
          {formData.socialLinks.length > 0 ? (
            <ul className="space-y-1">
              {formData.socialLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No social links provided</p>
          )}
        </div>
      </div>

      {/* Terms & Submit */}
      <div className="mt-6 md:mt-8 p-3 md:p-4 bg-gray-50 rounded-md border">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
            I accept the Terms and Conditions
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-center md:justify-end">
        <button
          onClick={handleSubmit}
          type="button"
          disabled={!accepted}
          className={`px-6 py-3 rounded-md text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full md:w-auto ${
            accepted
              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Registration'}
        </button>
      </div>
    </div>
  );
};

export default ReviewSubmit;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FundDetails: React.FC<{ fund: any }> = ({ fund }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Calculate time remaining until deadline
  useEffect(() => {
    if (fund?.deadline) {
      const updateTimeRemaining = () => {
        const now = new Date();
        const deadlineDate = new Date(fund.deadline);
        const timeDiff = deadlineDate.getTime() - now.getTime();

        if (timeDiff > 0) {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          setTimeRemaining(`${days}d ${hours}h remaining`);
        } else {
          setTimeRemaining('Deadline passed');
        }
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [fund?.deadline]);

  if (!fund) {
    return (
      <div className="flex items-center justify-center text-lg text-gray-500 h-96">
        No fund found.
      </div>
    );
  }

  const requiredDocs = fund.documentRequired || [
    'DPIIT Certificate',
    'Company incorporation certificate',
    'Pitch deck',
    'Business plan',
  ];

  const handleApply = () => {
    if (fund.urls && fund.urls.length > 0) {
      window.open(fund.urls[0], '_blank');
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fund.provider} - ${fund.type}`,
          text: fund.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleSupportLink = (index: number) => {
    if (fund.urls && fund.urls[index]) {
      window.open(fund.urls[index], '_blank');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDocumentDownload = (doc: any) => {
    window.open(doc.url, '_blank');
  };

  const handleContact = (type: 'email' | 'phone') => {
    if (type === 'email' && fund.contactEmail) {
      window.open(`mailto:${fund.contactEmail}`, '_blank');
    } else if (type === 'phone' && fund.supportPhone) {
      window.open(`tel:${fund.supportPhone}`, '_blank');
    }
  };

  return (
    <motion.div
      className="relative flex flex-col w-full max-w-6xl gap-6 p-6 mx-auto lg:flex-row"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-gray-100 rounded-full">
              {fund.logo ? (
                <img
                  src={fund.logo}
                  alt={`${fund.provider} logo`}
                  className="object-contain w-full h-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-blue-50">
                        <span class="text-blue-500 font-bold text-xl">${fund.provider?.charAt(0) || '?'}</span>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-blue-50">
                  <span className="text-xl font-bold text-blue-500">
                    {fund.provider?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{fund.provider || 'Unknown Provider'}</h2>
                {fund.verified && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {fund.launchDate
                  ? `Launched: ${new Date(fund.launchDate).toLocaleDateString()}`
                  : 'Active Grant Program'}
                {timeRemaining && fund.deadline && (
                  <span className="ml-2 text-orange-600">• {timeRemaining}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleShare}
            className="p-2 pl-4 pr-4 font-bold text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Share
          </button>
        </div>

        {/* About Grant */}
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <div className="mb-2 font-semibold text-gray-800">About this grant</div>
          <div className="mb-4 text-sm text-gray-600">
            {fund.description || 'No description provided.'}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleApply}
              className="px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Apply now
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2 font-medium rounded-md border transition-colors ${
                isSaved
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        {/* <div className="mb-4">
          <div className="mb-2 font-semibold text-gray-800">Application Trends</div>
          <Chart />
        </div> */}

        {/* Eligibility Criteria */}
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <div className="mb-2 font-semibold text-gray-800">Eligibility criteria</div>
          <div className="flex flex-wrap gap-2 mb-4">
            {fund.industryTags && fund.industryTags.length > 0 ? (
              fund.industryTags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium text-blue-600 rounded-full bg-blue-50"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                {fund.stage || 'All Industries'}
              </span>
            )}
          </div>
          {fund.evaluationCriteria && fund.evaluationCriteria.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">Key Requirements:</div>
              <ul className="pl-5 space-y-1 text-sm text-gray-600 list-disc">
                {fund.evaluationCriteria.map((criteria: string, index: number) => (
                  <li key={index}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Selection Process */}
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <div className="mb-2 font-semibold text-gray-800">Selection Process</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div
                className={`w-3 h-3 rounded-full ${fund.pitchRequired ? 'bg-orange-500' : 'bg-gray-300'}`}
              ></div>
              <span className="text-sm">Pitch Required: {fund.pitchRequired ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <div
                className={`w-3 h-3 rounded-full ${fund.interviewRequired ? 'bg-blue-500' : 'bg-gray-300'}`}
              ></div>
              <span className="text-sm">
                Interview Required: {fund.interviewRequired ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Required Documents */}
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-800">Required Documents</div>
            <button
              onClick={() => setShowAllDocs(!showAllDocs)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showAllDocs ? 'Show Less' : 'Show All'}
            </button>
          </div>
          <ul className="pl-5 space-y-1 text-sm text-gray-600 list-disc">
            {(showAllDocs ? requiredDocs : requiredDocs.slice(0, 5)).map(
              (doc: string, index: number) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="flex-1">{doc}</span>
                  <svg
                    className="flex-shrink-0 w-4 h-4 ml-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Download Resources */}
        {fund.documents && fund.documents.length > 0 && (
          <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
            <div className="mb-2 font-semibold text-gray-800">Download Resources</div>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {fund.documents.map((doc: any, index: number) => (
                <button
                  key={index}
                  onClick={() => handleDocumentDownload(doc)}
                  className="flex items-center w-full gap-2 p-2 text-sm text-left text-blue-600 rounded hover:bg-blue-50"
                >
                  <svg
                    className="flex-shrink-0 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate">{doc.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Important Dates */}
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <div className="mb-2 font-semibold text-gray-800">Important Dates</div>
          <div className="space-y-4">
            {fund.launchDate && (
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <div className="text-sm font-medium">Launch Date</div>
                  <div className="text-xs text-gray-500">
                    {new Date(fund.launchDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            {fund.deadline && (
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${new Date(fund.deadline) > new Date() ? 'bg-orange-500' : 'bg-red-500'}`}
                ></div>
                <div>
                  <div className="text-sm font-medium">Application Deadline</div>
                  <div className="text-xs text-gray-500">
                    {new Date(fund.deadline).toLocaleDateString()}
                  </div>
                  {timeRemaining && <div className="text-xs text-orange-600">{timeRemaining}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 w-full lg:w-80">
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <div className="mb-1 text-xs text-gray-500">Grant Amount</div>
          <div className="mb-2 text-2xl font-bold text-blue-700">₹{fund.amount || 'N/A'}</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {fund.industryTags && fund.industryTags.length > 0 ? (
              fund.industryTags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                {fund.entityType || 'All Entities'}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Business Stage</div>
              <div className="text-sm font-medium">{fund.stage || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Funding Type</div>
              <div className="text-sm font-medium">{fund.type || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Region</div>
              <div className="text-sm font-medium">{fund.region || 'Pan India'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Entity Type</div>
              <div className="text-sm font-medium">{fund.entityType || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <div className="mb-2 font-semibold text-gray-800">Contact Information</div>
          <div className="flex flex-col gap-2 text-sm">
            <button
              onClick={() => handleContact('email')}
              className="flex items-center gap-2 p-2 text-left transition-colors rounded hover:bg-gray-50"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-blue-600">{fund.contactEmail || 'Email not provided'}</span>
            </button>
            <button
              onClick={() => handleContact('phone')}
              className="flex items-center gap-2 p-2 text-left transition-colors rounded hover:bg-gray-50"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-blue-600">{fund.supportPhone || 'Phone not provided'}</span>
            </button>
          </div>
        </div>

        {fund.urls && fund.urls.length > 1 && (
          <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
            <div className="mb-2 font-semibold text-gray-800">Additional Resources</div>
            <div className="space-y-2">
              {fund.urls.slice(1).map((_url: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleSupportLink(index + 1)}
                  className="flex items-center w-full gap-2 p-2 text-sm text-left text-blue-600 transition-colors rounded hover:bg-blue-50"
                >
                  <svg
                    className="flex-shrink-0 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6l-6 6"
                    />
                  </svg>
                  <span className="truncate">Support Link {index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="mb-2 font-semibold text-gray-800">Quick Actions</div>
          <div className="space-y-2">
            <button
              onClick={handleApply}
              className="w-full px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Apply Now
            </button>
            <button
              onClick={handleSave}
              className={`w-full px-4 py-2 font-medium rounded-md border transition-colors ${
                isSaved
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isSaved ? '✓ Saved' : 'Save for Later'}
            </button>
            <button
              onClick={handleShare}
              className="w-full px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Share Grant
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FundDetails;

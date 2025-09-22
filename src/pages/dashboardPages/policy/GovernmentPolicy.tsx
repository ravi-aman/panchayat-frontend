import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Carousel from '../../../components/common/Carousel';
import axios from 'axios';

// Types
interface PolicyInfo {
  _id: string;
  icon: string;
  title: string;
  date: string;
  description: string;
  category: string[];
  ministerName: string;
  ministerImage: string;
  type: 'New' | 'Updated' | 'Upcoming';
  link: string;
}

interface CarouselItem {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
}

const PolicyCard: React.FC<{ policy: PolicyInfo }> = ({ policy }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-GB', options);
  };

  return (
    <motion.div
      className="p-5 bg-white border border-gray-100 rounded-lg shadow-sm"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center w-full gap-3">
          <div className="flex items-center justify-center w-16 h-12 overflow-hidden bg-gray-100 rounded-lg">
            <img
              src={policy.icon}
              alt={`${policy.title} icon`}
              className="object-contain w-full h-full"
            />
          </div>
          <div className="flex flex-col w-full gap-1">
            <span className="text-sm font-semibold">{policy.title}</span>
            <div
              className={`text-xs w-fit mt-1 inline-block px-2 py-1 rounded-full ${
                policy.type === 'New'
                  ? 'bg-green-100 text-green-800'
                  : policy.type === 'Updated'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
              }`}
            >
              {policy.type} Policy
            </div>
            <div className="flex justify-end w-full text-xs text-gray-500 text-nowrap">
              {formatDate(policy.date)}
            </div>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-gray-600 break-words whitespace-pre-line">
        {policy.description.length > 150
          ? policy.description.slice(0, 150) + '...'
          : policy.description}
      </p>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">Categories</p>
        <div className="flex flex-wrap gap-2">
          {policy.category.map((cat, index) => (
            <span key={index} className="px-3 py-1 text-xs text-gray-800 bg-gray-100 rounded-full">
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center">
          <div className="w-8 h-8 mr-2 overflow-hidden bg-gray-200 rounded-full">
            <img
              src={policy.ministerImage}
              alt={policy.ministerName}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <p className="text-sm font-medium">{policy.ministerName}</p>
            <p className="text-xs text-gray-500">Minister</p>
          </div>
        </div>

        <a href={policy.link} target="_blank" rel="noopener noreferrer">
          <motion.button
            className="flex items-center text-sm text-blue-500"
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
          >
            View Details
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </motion.button>
        </a>
      </div>
    </motion.div>
  );
};

const GovernmentPolicy: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'policies' | 'news' | 'insights'>('policies');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [policies, setPolicies] = useState<PolicyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/government_policies`,
        {
          headers: {
            ...(import.meta.env.NODE_ENV === 'development' && { 'X-Dev-Bypass': 'true' }),
          },
        },
      );
      if (!res.data.policies || res.data.policies.length === 0) {
        throw new Error('No policies found');
      }
      setPolicies(res.data.policies);
    } catch (err) {
      console.error('Failed to fetch policies', err);
      setError('Server maintenance');
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Convert policies to carousel items - show latest 3 policies only
  const carouselItems: CarouselItem[] =
    policies.length > 0
      ? policies
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3)
          .map((policy) => ({
            id: policy._id,
            title: policy.title,
            description:
              policy.description.length > 120
                ? policy.description.slice(0, 120) + '...'
                : policy.description,
            image: policy.icon,
            link: policy.link,
          }))
      : [];

  // Get unique categories from all policies
  const allCategories = policies.flatMap((policy) => policy.category);
  const uniqueCategories = [...new Set(allCategories)].filter(Boolean);

  const filteredPolicies =
    Array.isArray(policies) && policies.length > 0
      ? policies.filter((policy) => {
          const matchesSearch =
            (policy.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (policy.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
          const matchesCategory = !selectedCategory || policy.category.includes(selectedCategory);
          return matchesSearch && matchesCategory;
        })
      : [];
  const SkeletonCard = () => (
    <div className="p-5 bg-white border border-gray-100 rounded-lg shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center w-full gap-3">
          <div className="w-16 h-12 bg-gray-200 rounded-lg"></div>
          <div className="flex flex-col w-full gap-1">
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-3 bg-gray-200 rounded"></div>
            <div className="w-16 h-3 ml-auto bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <div className="w-full h-3 mb-2 bg-gray-200 rounded"></div>
      <div className="w-4/5 h-3 mb-4 bg-gray-200 rounded"></div>
      <div className="mb-4">
        <div className="w-20 h-3 mb-2 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center">
          <div className="w-8 h-8 mr-2 bg-gray-200 rounded-full"></div>
          <div>
            <div className="w-20 h-3 mb-1 bg-gray-200 rounded"></div>
            <div className="w-12 h-2 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'policies':
        if (loading) {
          return (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="w-64 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </>
          );
        }

        if (error) {
          return (
            <div className="flex flex-col items-center justify-center px-4 text-center h-96">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-700">
                Servers Under Maintenance
              </h3>
              <p className="mb-4 text-gray-500">
                We're working hard to get things back up and running. We'll be back soon!
              </p>
              <button
                onClick={fetchPolicies}
                className="px-4 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          );
        }

        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Latest Government Policies</h2>
              <button
                className="text-sm text-blue-500 transition-colors hover:text-blue-600"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
              >
                View All
              </button>
            </div>
            <motion.div
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              {filteredPolicies.map((policy) => (
                <PolicyCard key={policy._id} policy={policy} />
              ))}
            </motion.div>
          </>
        );
      case 'news':
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Latest News</h2>
              <button className="text-sm text-blue-500">View All</button>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Sample news cards here */}
              <div className="overflow-hidden bg-white rounded-lg shadow-sm">
                <img src="/assets/news1.jpg" className="object-cover w-full h-40" alt="News" />
                <div className="p-4">
                  <div className="mb-1 text-xs text-gray-500">February 15, 2025</div>
                  <h3 className="mb-2 font-medium">National MSME summit 2024 Announced</h3>
                  <p className="mb-3 text-sm text-gray-600">
                    Dui orc consectetur sagittis euismod vitae. Lorem ipsum dolor sit amet.
                  </p>
                  <button className="text-sm text-blue-500">Read more</button>
                </div>
              </div>
              <div className="overflow-hidden bg-white rounded-lg shadow-sm">
                <img src="/assets/news2.jpg" className="object-cover w-full h-40" alt="News" />
                <div className="p-4">
                  <div className="mb-1 text-xs text-gray-500">February 13, 2025</div>
                  <h3 className="mb-2 font-medium">Digital Transformation Fund Launched</h3>
                  <p className="mb-3 text-sm text-gray-600">
                    Dui orc consectetur sagittis euismod vitae. Lorem ipsum dolor sit amet.
                  </p>
                  <button className="text-sm text-blue-500">Read more</button>
                </div>
              </div>
              <div className="overflow-hidden bg-white rounded-lg shadow-sm">
                <img src="/assets/news3.jpg" className="object-cover w-full h-40" alt="News" />
                <div className="p-4">
                  <div className="mb-1 text-xs text-gray-500">February 18, 2025</div>
                  <h3 className="mb-2 font-medium">Startup India Achievement Report</h3>
                  <p className="mb-3 text-sm text-gray-600">
                    Dui orc consectetur sagittis euismod vitae. Lorem ipsum dolor sit amet.
                  </p>
                  <button className="text-sm text-blue-500">Read more</button>
                </div>
              </div>
            </div>
          </>
        );
      case 'insights':
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Expert Insights</h2>
              <button className="text-sm text-blue-500">View All</button>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="p-5 bg-white rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full">
                    <img
                      src="/assets/expert1.jpg"
                      className="object-cover w-full h-full rounded-full"
                      alt="Expert"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Dr. Rajiv Kumar</h3>
                    <p className="text-xs text-gray-500">Policy Expert</p>
                  </div>
                </div>
                <p className="mb-3 text-sm text-gray-600">
                  "The new MSME policies are designed to create a more resilient ecosystem that can
                  weather economic fluctuations better than in the past."
                </p>
                <div className="text-xs text-gray-500">February 16, 2025</div>
              </div>
              <div className="p-5 bg-white rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full">
                    <img
                      src="/assets/expert2.jpg"
                      className="object-cover w-full h-full rounded-full"
                      alt="Expert"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">Prof. Sunita Sharma</h3>
                    <p className="text-xs text-gray-500">Economic Analyst</p>
                  </div>
                </div>
                <p className="mb-3 text-sm text-gray-600">
                  "Digital transformation of MSMEs is no longer optional but necessary for survival
                  in today's competitive marketplace."
                </p>
                <div className="text-xs text-gray-500">February 14, 2025</div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="w-full min-h-screen p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h1
              className="text-3xl font-bold"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              Explore Government Policies
            </motion.h1>
            <motion.p
              className="mt-2 text-lg text-gray-600"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
              Discover various government initiatives to help your business grow
            </motion.p>
          </div>

          <motion.button
            className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Share Policy
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              ></path>
            </svg>
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-4">
            <motion.div
              className="flex items-center flex-1 px-3 bg-white border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, delay: 0.1 }}
              whileHover={{ boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search policies..."
                className="w-full px-3 py-3 text-sm outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </motion.div>

            <motion.div
              className="relative flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, delay: 0.2 }}
              ref={dropdownRef}
            >
              <button
                className="flex items-center px-3 py-3 text-sm bg-white border border-gray-300 rounded-md"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                {selectedCategory || 'Categories'}
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {showCategoryDropdown && (
                <div className="absolute left-0 z-10 w-48 mt-1 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg top-full max-h-60">
                  <button
                    className="w-full px-3 py-2 text-sm text-left border-b border-gray-100 hover:bg-gray-50"
                    onClick={() => {
                      setSelectedCategory('');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    All Categories
                  </button>
                  {uniqueCategories.map((category, index) => (
                    <button
                      key={index}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50"
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              className="flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, delay: 0.3 }}
            >
              <button className="flex items-center px-3 py-3 text-sm bg-white border border-gray-300 rounded-md">
                Industries
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>
            </motion.div>
          </div>
        </div>

        {carouselItems.length > 0 && <Carousel items={carouselItems} />}

        {/* Navigation Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${activeTab === 'policies' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('policies')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
            Policies
          </button>

          <button
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${activeTab === 'news' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('news')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            News
          </button>

          <button
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 ${activeTab === 'insights' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('insights')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            Insights
          </button>
        </div>

        {/* Content Area */}
        {renderTabContent()}
      </div>
    </motion.div>
  );
};

export default GovernmentPolicy;

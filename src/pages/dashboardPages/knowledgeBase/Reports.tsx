import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios, { CancelTokenSource } from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

// Types
interface Report {
  _id: string;
  title: string;
  type: 'report' | 'scheme';
  description: string;
  imageUrl: string;
  pdfUrl?: string;
  date?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface PolicyItem {
  _id: string;
  title: string;
  type: 'policy';
  description: string;
  icon: string;
  date: string;
}

interface CategoryFilter {
  id: string;
  name: string;
  count?: number;
}

// interface Industry {
//   id: string;
//   name: string;
// }

interface ApiResponse {
  status: string;
  data: Report[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  };
}

const Reports: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reports, setReports] = useState<Report[]>([]);
  const [policyItems, setPolicyItems] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  // const [showIndustryDropdown, setShowIndustryDropdown] = useState<boolean>(false);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Refs
  const observerTarget = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const categories: CategoryFilter[] = [
    { id: 'all', name: 'All Categories' },
    { id: 'report', name: 'Annual Reports' },
    { id: 'scheme', name: 'Government Schemes' },
    { id: 'policy', name: 'Policy Updates' },
  ];

  // const industries: Industry[] = [
  //   { id: 'all', name: 'All Industries' },
  //   { id: 'technology', name: 'Technology' },
  //   { id: 'healthcare', name: 'Healthcare' },
  //   { id: 'finance', name: 'Finance' },
  //   { id: 'manufacturing', name: 'Manufacturing' },
  //   { id: 'agriculture', name: 'Agriculture' },
  //   { id: 'education', name: 'Education' },
  //   { id: 'energy', name: 'Energy' },
  //   { id: 'retail', name: 'Retail' },
  // ];

  const sortOptions = [
    {
      id: 'createdAt-desc',
      label: 'Newest First',
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    },
    { id: 'createdAt-asc', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' as const },
    { id: 'title-asc', label: 'Title A-Z', sortBy: 'title', sortOrder: 'asc' as const },
    { id: 'title-desc', label: 'Title Z-A', sortBy: 'title', sortOrder: 'desc' as const },
  ];

  // Fetch reports with pagination
  const fetchReports = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      try {
        // Cancel previous request if it exists
        if (cancelTokenRef.current) {
          cancelTokenRef.current.cancel('New search initiated');
        }

        // Create new cancel token
        cancelTokenRef.current = axios.CancelToken.source();

        if (page === 1) {
          setLoading(true);
          setIsSearching(true);
        } else {
          setLoadingMore(true);
        }
        setError('');

        const params: Record<string, string | number> = {
          page,
          limit: 12,
          sortBy,
          sortOrder,
        };

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        if (selectedCategory !== 'all') {
          params.type = selectedCategory;
        }

        // // Apply industry filter when selected
        // if (selectedIndustry !== 'all') {
        //   // adjust param name to match your backend (industry / industries)
        //   params.industry = selectedIndustry;
        // }

        // Add status filter to only show active reports
        params.status = 'active';

        // Add delay for better UX when searching
        const searchDelay = page === 1 && searchQuery ? 300 : 0;

        await new Promise((resolve) => setTimeout(resolve, searchDelay));

        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/reports`,
          {
            params,
            cancelToken: cancelTokenRef.current.token,
          },
        );

        const newReports = response.data.data || [];
        const pagination = response.data.pagination;

        if (reset || page === 1) {
          setReports(newReports);
        } else {
          setReports((prev) => [...prev, ...newReports]);
        }

        setTotalCount(pagination.totalCount);
        setHasMore(page < pagination.totalPages);
        setCurrentPage(page);
      } catch (error) {
        // Don't show error if request was cancelled (this is normal during fast typing)
        if (axios.isCancel(error)) {
          console.log('Request cancelled:', error.message);
          return;
        }

        console.error('Error fetching reports:', error);
        setError('Failed to load reports. Please try again.');
        if (page === 1) {
          setReports([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setIsSearching(false);
      }
    },
    [
      searchQuery,
      selectedCategory,
      // selectedIndustry,
      sortBy,
      sortOrder,
    ],
  );

  // Fetch policies
  const fetchPolicies = useCallback(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/report_policy`);
      const data = response.data.data || [];
      setPolicyItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      setPolicyItems([]);
    }
  }, []);

  // Initial load and search/filter changes
  useEffect(() => {
    fetchReports(1, true);
  }, [fetchReports]);

  // Load policies once
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Initialize inputValue with searchQuery to keep them in sync
  useEffect(() => {
    setInputValue(searchQuery);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchReports(currentPage + 1);
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, currentPage, fetchReports]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        industryDropdownRef.current &&
        !industryDropdownRef.current.contains(event.target as Node)
      ) {
        // setShowIndustryDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search with professional debounce
  const handleSearch = useCallback(
    (query: string) => {
      // Update the input value immediately for responsive UI
      setInputValue(query);

      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set searching state for UI feedback
      setIsSearching(true);

      // Only perform the search if the query is empty or has at least 2 characters
      // Empty query (reset) or query with enough characters to be meaningful
      const shouldPerformSearch = query === '' || query.length >= 2;

      if (!shouldPerformSearch) {
        // If we don't search, still need to reset the searching state
        setIsSearching(false);
        return;
      }

      // Use different debounce timing based on query length for better UX
      // Quick response for empty queries, longer for short queries, medium for longer queries
      const debounceTime = query === '' ? 100 : query.length < 4 ? 600 : 300;

      // Set the debounced search
      debounceTimerRef.current = setTimeout(() => {
        setSearchQuery(query);
        if (query !== searchQuery) {
          setCurrentPage(1);
        }
      }, debounceTime);
    },
    [searchQuery],
  );

  // Hook to perform the search after debounce
  useEffect(() => {
    // Only fetch if query has been set (after debounce)
    fetchReports(1, true);

    // Cleanup on unmount
    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
    };
  }, [searchQuery, fetchReports]);

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
    setCurrentPage(1);
  };

  // Handle industry change
  // const handleIndustryChange = (industryId: string) => {
  //   setSelectedIndustry(industryId);
  //   setShowIndustryDropdown(false);
  //   setCurrentPage(1);
  //   // trigger fetch immediately for new industry
  //   fetchReports(1, true);
  // };

  // Handle sort change
  const handleSortChange = (option: (typeof sortOptions)[0]) => {
    setSortBy(option.sortBy);
    setSortOrder(option.sortOrder);
    setShowSortDropdown(false);
    setCurrentPage(1);
  };

  // Filter reports by type for display
  const reportsByType = {
    report: reports.filter((item) => item.type === 'report'),
    scheme: reports.filter((item) => item.type === 'scheme'),
  };

  const shouldShowSection = (type: string) => {
    return selectedCategory === 'all' || selectedCategory === type;
  };

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }

      // Clear any pending timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className="w-full max-w-6xl p-4 mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="mb-6">
        <motion.h1
          className="text-3xl font-bold text-gray-800"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Reports & Government Schemes
        </motion.h1>
        <motion.p
          className="mt-1 text-lg text-gray-600"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          Access the latest reports on market potential and benefit reports to help your business
          grow
        </motion.p>

        {/* Stats */}
        <motion.div
          className="flex gap-4 mt-4 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span>{totalCount} total items</span>
          {searchQuery && <span>• Searching for "{searchQuery}"</span>}
          {selectedCategory !== 'all' && (
            <span>• {categories.find((c) => c.id === selectedCategory)?.name}</span>
          )}
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row">
        <motion.div
          className="relative flex-1 bg-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <input
            type="text"
            placeholder="Search reports, schemes, or policies..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={inputValue}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {loading || isSearching ? (
              <div className="w-5 h-5 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </motion.div>
        {/* Group Category + Sort into a responsive row so they sit side-by-side on mobile */}
        <div className="flex w-full gap-2 sm:gap-4">
          <motion.div
            className="relative flex-1"
            ref={categoryDropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <button
              className="flex items-center justify-between w-full gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex-1 sm:w-auto min-w-[140px]"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <span>{categories.find((c) => c.id === selectedCategory)?.name || 'Categories'}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <AnimatePresence>
              {showCategoryDropdown && (
                <motion.div
                  className="absolute right-0 z-10 w-48 mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700'
                      }`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="relative flex-1"
            ref={sortDropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <button
              className="flex items-center justify-between w-full gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex-1 sm:w-auto min-w-[120px]"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              <span>
                {sortOptions.find((opt) => opt.sortBy === sortBy && opt.sortOrder === sortOrder)
                  ?.label || 'Sort'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <AnimatePresence>
              {showSortDropdown && (
                <motion.div
                  className="absolute right-0 z-10 w-40 mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${
                        sortBy === option.sortBy && sortOrder === option.sortOrder
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700'
                      }`}
                      onClick={() => handleSortChange(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          className="p-4 mb-6 text-red-700 bg-red-100 border border-red-200 rounded-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Content Sections */}
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingGrid />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Annual Reports Section */}
            {shouldShowSection('report') && reportsByType.report.length > 0 && (
              <ReportSection
                title="Annual Reports"
                reports={reportsByType.report}
                isEmpty={false}
              />
            )}

            {/* Government Schemes Section */}
            {shouldShowSection('scheme') && reportsByType.scheme.length > 0 && (
              <ReportSection
                title="Featured Government Schemes"
                reports={reportsByType.scheme}
                isEmpty={false}
              />
            )}

            {/* Policy Updates Section */}
            {shouldShowSection('policy') && policyItems.length > 0 && (
              <PolicySection policies={policyItems} />
            )}

            {/* Load More Indicator */}
            {loadingMore && (
              <motion.div
                className="flex justify-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </motion.div>
            )}

            {/* End of Results */}
            {!hasMore && reports.length > 0 && (
              <motion.div
                className="py-8 text-center text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p>You've reached the end of the results</p>
                <p className="text-sm">Total items loaded: {reports.length}</p>
              </motion.div>
            )}

            {/* No Results */}
            {!loading && reports.length === 0 && <EmptyState searchQuery={searchQuery} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="h-10" />
    </motion.div>
  );
};

// Report Section Component
const ReportSection: React.FC<{
  title: string;
  reports: Report[];
  isEmpty: boolean;
}> = ({ title, reports, isEmpty }) => {
  if (isEmpty) return null;

  return (
    <section className="mb-8">
      <motion.h2
        className="mb-4 text-lg font-bold"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {title} ({reports.length})
      </motion.h2>
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {reports.map((report) => (
          <ReportCard key={report._id} report={report} />
        ))}
      </motion.div>
    </section>
  );
};

// Policy Section Component
const PolicySection: React.FC<{ policies: PolicyItem[] }> = ({ policies }) => {
  return (
    <section className="mb-8">
      <motion.h2
        className="mb-4 text-lg font-bold"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Recent Policy Updates ({policies.length})
      </motion.h2>
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {policies.length > 0 ? (
          policies.map((policy) => <PolicyCard key={policy._id} policy={policy} />)
        ) : (
          <p className="text-gray-500">No policy updates available</p>
        )}
      </motion.div>
    </section>
  );
};

// Report Card Component
const ReportCard: React.FC<{ report: Report }> = ({ report }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDownload = () => {
    if (report.pdfUrl) {
      window.open(report.pdfUrl, '_blank');
    }
  };

  return (
    <motion.div
      className="overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        if (isAuthenticated && !isAuthenticated()) {
          window.location.href = '/auth/signin';
          return;
        }
        handleDownload();
      }}
    >
      <div className="relative h-40 overflow-hidden bg-gray-100">
        {!imageError ? (
          <img
            src={report.imageUrl}
            alt={report.title}
            className="object-cover w-full h-full transition-transform"
            onError={handleImageError}
            loading="lazy"
            style={{
              // apply blur on hover and smooth transition, also slightly scale for effect
              filter: isHovered ? 'blur(4px)' : 'none',
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'filter 200ms ease, transform 200ms ease',
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-4xl font-bold text-gray-400 bg-gray-100">
            {report.title.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Overlay on hover (no black background - just centered label) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-black bg-black/0">
                {report.pdfUrl ? 'View Report' : 'Read More'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              report.type === 'report' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {report.type === 'report' ? 'Report' : 'Scheme'}
          </span>
        </div>

        {/* PDF indicator */}
        {report.pdfUrl && (
          <div className="absolute top-2 right-2">
            <div className="p-1 bg-white rounded-full shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-2 font-medium leading-tight text-gray-900 line-clamp-2">
          {report.title}
        </h3>
        <p className="mb-3 text-sm text-gray-600 line-clamp-3">{report.description}</p>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {report.date ||
              new Date(report.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // reuse same auth check logic
              if (isAuthenticated && !isAuthenticated()) {
                window.location.href = '/auth/signin';
                return;
              }
              handleDownload();
            }}
            className="flex items-center gap-1 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600"
          >
            Read more
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Policy Card Component
const PolicyCard: React.FC<{ policy: PolicyItem }> = ({ policy }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="flex gap-4 p-4 transition-all duration-300 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md"
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
      }}
      initial="hidden"
      animate="visible"
      whileHover={{ x: 4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-blue-500 bg-blue-100 rounded-lg">
        {policy.icon?.startsWith('http') ? (
          <img
            src={policy.icon}
            alt={policy.title}
            className="object-contain w-6 h-6"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                `;
              }
            }}
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="mb-1 font-medium text-gray-900 line-clamp-2">{policy.title}</h3>
        <p className="mb-2 text-sm text-gray-600 line-clamp-3">{policy.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {new Date(policy.date).toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>

          <motion.div
            className="text-blue-500"
            animate={{ x: isHovered ? 4 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// Loading Grid Component
const LoadingGrid: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <div className="w-48 h-6 mb-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden bg-white border border-gray-200 rounded-lg">
              <div className="h-40 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-3">
                <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-2/3 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ searchQuery: string }> = ({ searchQuery }) => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-16 h-16 mb-4 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-full h-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">
        {searchQuery ? `No results found for "${searchQuery}"` : 'No reports available'}
      </h3>
      <p className="mb-4 text-gray-500">
        {searchQuery
          ? 'Try adjusting your search terms or filters'
          : 'Check back later for new reports and updates'}
      </p>
      {searchQuery && (
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm text-blue-600 transition-colors border border-blue-600 rounded-md hover:bg-blue-50"
        >
          Clear search
        </button>
      )}
    </motion.div>
  );
};

export default Reports;

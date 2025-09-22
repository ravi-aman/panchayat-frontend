import React, { useState, lazy, Suspense, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import FundsFilter from './FundsFilter';
import FundCreateForm from './FundCreateForm';
import axios from 'axios';

interface FundingOpportunity {
  id: string;
  provider: string;
  date: string;
  active: boolean;
  description: string;
  amount: string;
  minAmount?: string;
  maxAmount?: string;
  industry: string;
  industryCount: number;
  industryTags: string[];
  region: string;
  stage: string;
  team: string;
  teamDate?: string;
  type: string;
  logo: string;
  deadline?: string;
  launchDate?: string;
  entityType?: string;
  verified?: boolean;
  pitchRequired?: boolean;
  interviewRequired?: boolean;
}
const FundDetails = lazy(() => import('./FundDetails'));

interface FilterOptions {
  keyword?: string;
  type?: string;
  stage?: string;
  region?: string;
  minAmount?: string;
  maxAmount?: string;
}

const Funds: React.FC = () => {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFundForm, setShowFundForm] = useState(false);
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 6;
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const fetchOpportunities = useCallback(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string> = {
      page: page.toString(),
      limit: LIMIT.toString(),
    };
    if (filters) {
      if (filters.keyword) params['keyword'] = filters.keyword;
      if (filters.type) params['type'] = filters.type;
      if (filters.stage) params['stage'] = filters.stage;
      if (filters.region) params['region'] = filters.region;
      if (filters.minAmount) params['minAmount'] = filters.minAmount;
      if (filters.maxAmount) params['maxAmount'] = filters.maxAmount;
    }

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/opportunities`, {
        params,
        headers: { 'X-Dev-Bypass': 'true' },
      })
      .then((res) => {
        let newData: FundingOpportunity[] = [];
        if (Array.isArray(res.data.data)) {
          newData = res.data.data;
        } else if (res.data.opportunities) {
          newData = res.data.opportunities;
        } else if (Array.isArray(res.data)) {
          newData = res.data;
        }
        setOpportunities((prev) => (page === 1 ? newData : [...prev, ...newData]));
        if (res.data.pagination) {
          setHasMore(res.data.pagination.hasNext);
        } else {
          setHasMore(newData.length === LIMIT);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.response.data.message == 'No funding opportunities found matching your criteria') {
          setLoading(false);
          return;
        }
        setError('Server maintenance');
        setLoading(false);
      });
  }, [page, filters]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  useEffect(() => {
    setPage(1);
    setOpportunities([]);
    setHasMore(true);
  }, [filters]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastOpportunityRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.1 },
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  const handleCreateFund = () => {
    setShowFundForm(false);
    // Refresh after creation
    setPage(1);
    setOpportunities([]);
    setHasMore(true);
    fetchOpportunities();
  };

  if (id) {
    const fund = opportunities.find((o) => o.id === id);
    return (
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="flex flex-col items-center w-full max-w-lg p-8 bg-white rounded shadow animate-pulse">
              <div className="w-24 h-24 mb-4 bg-gray-200 rounded-full"></div>
              <div className="w-2/3 h-6 mb-2 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-4 mb-4 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mb-2 bg-gray-200 rounded"></div>
              <div className="w-4/5 h-3 mb-2 bg-gray-200 rounded"></div>
              <div className="w-3/5 h-3 mb-2 bg-gray-200 rounded"></div>
              <div className="flex gap-2 mt-4">
                <div className="w-24 h-10 bg-gray-200 rounded"></div>
                <div className="w-24 h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        }
      >
        <FundDetails fund={fund} />
      </Suspense>
    );
  }

  if (error) {
    return (
      <motion.div
        className="flex flex-col w-full p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between py-6 mb-4">
            <div>
              <motion.h1
                className="text-lg font-bold lg:text-3xl"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                Funding Opportunities
              </motion.h1>
              <motion.p
                className="w-full mt-3 text-sm text-gray-600 lg:w-90 lg:text-lg"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                Discover various funding options to help grow your startup
              </motion.p>
            </div>
            <div className="flex gap-2 ml-2">
              <button className="px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-400 rounded-md lg:px-4 lg:py-2 lg:text-md">
                Popular Ones
              </button>
              <button className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-md lg:px-4 lg:py-2 lg:text-md">
                Grants
              </button>
              <motion.button
                className="flex items-center gap-1 p-2 text-xs font-medium text-white bg-blue-500 rounded-md lg:text-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                onClick={() => setShowFundForm(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1E5EFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Funds
              </motion.button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center px-4 text-center h-96">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="#1E5EFF"
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
            <h3 className="mb-2 text-xl font-semibold text-gray-700">Servers Under Maintenance</h3>
            <p className="mb-4 text-gray-500">
              We're working hard to get things back up and running. We'll be back soon!
            </p>
            <button
              onClick={fetchOpportunities}
              className="px-4 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="min-h-screen w-full bg-[#F3F4F6]">
        {/* Header Section */}
        <motion.div
          className="relative py-4 bg-[#F3F4F6] border-b border-gray-100"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-full px-4">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <motion.h1
                    className="text-3xl font-bold text-gray-800"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Funding Opportunities
                  </motion.h1>
                </div>
                <motion.p
                  className="max-w-2xl text-lg leading-relaxed text-gray-600"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Discover various funding options to help grow your startup
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-4 text-sm text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{opportunities.length} funding opportunities</span>
                  </div>
                  {filters?.keyword && (
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4 text-blue-500"
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
                      <span>Searching for "{filters.keyword}"</span>
                    </div>
                  )}
                </motion.div>
              </div>
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  onClick={() => {
                    setPage(1);
                    fetchOpportunities();
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Refresh</span>
                </motion.button>
                <motion.button
                  onClick={() => setShowFundForm(true)}
                  className="bg-[#1E5EFF] rounded-sm p-2 flex gap-1 text-white font-semibold px-3 transition-all duration-300 hover:bg-blue-700 active:scale-95 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <h1>Create Funds</h1>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="self-center w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="p-4">
          <FundsFilter onFilter={setFilters} />
          {!loading && opportunities.length === 0 && filters ? (
            <div className="flex flex-col items-center justify-center px-4 text-center h-96 mx-auto">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="#1E5EFF"
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
                No funding opportunities found
              </h3>
              <p className="mb-4 text-gray-500">
                No results match your current filters. Try adjusting your filters to find more
                opportunities.
              </p>
              <button
                onClick={() => setFilters(null)}
                className="px-4 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-6 md:grid-cols-2"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
              }}
            >
              {opportunities.map((opportunity, index) => {
                if (index === opportunities.length - 1) {
                  return (
                    <div ref={lastOpportunityRef} key={opportunity.id}>
                      <OpportunityCard
                        opportunity={opportunity}
                        onViewDetails={() => navigate(`/dashboard/funds/${opportunity.id}`)}
                      />
                    </div>
                  );
                }
                return (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onViewDetails={() => navigate(`/dashboard/funds/${opportunity.id}`)}
                  />
                );
              })}
            </motion.div>
          )}

          {loading && page > 1 && (
            <div className="flex justify-center py-6">
              <span className="text-sm text-gray-500">Loading more funding opportunities...</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFundForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-500/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl w-full ml-5 mr-5 lg:h-[90vh] h-[80vh] lg:max-w-5xl max-w-4xl mx-2 p-4 relative overflow-auto scrollbar-hide"
              initial={{ scale: 0.95, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 40, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FundCreateForm onSubmit={handleCreateFund} onCancel={() => setShowFundForm(false)} />
              <button
                className="absolute text-2xl text-gray-400 top-3 right-3 hover:text-gray-600"
                onClick={() => setShowFundForm(false)}
              >
                &times;
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const OpportunityCard: React.FC<{ opportunity: FundingOpportunity; onViewDetails: () => void }> = ({
  opportunity,
  onViewDetails,
}) => {
  const maxDescriptionLength = 120;
  const truncatedDescription =
    opportunity.description.length > maxDescriptionLength
      ? opportunity.description.substring(0, maxDescriptionLength) + '...'
      : opportunity.description;

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    try {
      const date = new Date(deadline);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return deadline;
    }
  };

  return (
    <motion.div
      className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 md:min-h-[400px]"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Section */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center flex-1 min-w-0 gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden border border-gray-200 rounded-lg bg-gray-50">
              {opportunity.logo ? (
                <img
                  src={
                    opportunity.logo.startsWith('http')
                      ? opportunity.logo
                      : `${import.meta.env.VITE_BACKEND_URL}/api/v1/file/${opportunity.logo}`
                  }
                  alt={`${opportunity.provider} logo`}
                  className="object-contain w-full h-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E5EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 17h2.095c.98 0 1.469 0 1.872-.37.403-.372.474-.967.617-2.157L7 10.126c.067-.557.1-.835.232-1.024.132-.189.329-.292.722-.5l2.48-1.315c.327-.173.49-.26.654-.26.164 0 .328.087.655.26l2.48 1.315c.394.208.59.311.722.5.132.189.165.467.232 1.024l.416 4.347c.143 1.19.214 1.785.617 2.157.403.37.892.37 1.872.37H20" />
                        <path d="M8.5 18.5V13a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5.5" />
                        <path d="M2 17h20" />
                      </svg>
                    `;
                  }}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1E5EFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 17h2.095c.98 0 1.469 0 1.872-.37.403-.372.474-.967.617-2.157L7 10.126c.067-.557.1-.835.232-1.024.132-.189.329-.292.722-.5l2.48-1.315c.327-.173.49-.26.654-.26.164 0 .328.087.655.26l2.48 1.315c.394.208.59.311.722.5.132.189.165.467.232 1.024l.416 4.347c.143 1.19.214 1.785.617 2.157.403.37.892.37 1.872.37H20" />
                  <path d="M8.5 18.5V13a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5.5" />
                  <path d="M2 17h20" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {opportunity.provider}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {opportunity.entityType || 'Funding Opportunity'}
              </p>
            </div>
          </div>
          <div className="flex items-center flex-shrink-0 gap-2">
            {opportunity.verified && (
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[rgba(94,139,253,0.08)]">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1E5EFF"
                  strokeWidth="2"
                >
                  <path d="m9 12 2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {opportunity.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
            {opportunity.type}
          </span>
          {opportunity.deadline && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E5EFF"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Due: {formatDeadline(opportunity.deadline)}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm leading-relaxed text-gray-600">
            {truncatedDescription}
            {opportunity.description.length > maxDescriptionLength && (
              <button
                onClick={onViewDetails}
                className="ml-1 text-sm font-medium text-blue-500 hover:text-blue-600"
              >
                Read more
              </button>
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 px-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-600 bg-[#F2F2F7] rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E5EFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 17h2.095c.98 0 1.469 0 1.872-.37.403-.372.474-.967.617-2.157L7 10.126c.067-.557.1-.835.232-1.024.132-.189.329-.292.722-.5l2.48-1.315c.327-.173.49-.26.654-.26.164 0 .328.087.655.26l2.48 1.315c.394.208.59.311.722.5.132.189.165.467.232 1.024l.416 4.347c.143 1.19.214 1.785.617 2.157.403.37.892.37 1.872.37H20" />
                <path d="M8.5 18.5V13a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5.5" />
                <path d="M2 17h20" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1 text-xs text-gray-500">Funding Amount</div>
              <div className="text-sm font-semibold text-gray-900">₹{opportunity.amount}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-purple-600 bg-[#F2F2F7] rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E5EFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1 text-xs text-gray-500">Industry</div>
              <div className="flex items-center gap-1">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {opportunity.industry || 'All Industries'}
                </div>
                {opportunity.industryTags && opportunity.industryTags.length > 0 && (
                  <span className="px-1.5 py-0.5 text-xs text-purple-600 bg-purple-100 rounded font-medium">
                    +{opportunity.industryTags.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-600 bg-[#F2F2F7] rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E5EFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
                <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
                <path d="M4 15v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1 text-xs text-gray-500">Stage</div>
              <div className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-md">
                {opportunity.stage}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-orange-600 bg-[#F2F2F7] rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1E5EFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-1 text-xs text-gray-500">Region</div>
              <div className="text-sm font-semibold text-gray-900 truncate">
                {opportunity.region}
              </div>
            </div>
          </div>
        </div>

        {(opportunity.pitchRequired || opportunity.interviewRequired) && (
          <div className="mb-4">
            <div className="mb-2 text-xs text-gray-500">Requirements</div>
            <div className="flex gap-2">
              {opportunity.pitchRequired && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-md">
                  Pitch Required
                </span>
              )}
              {opportunity.interviewRequired && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-800 bg-indigo-100 rounded-md">
                  Interview Required
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 rounded-b-lg bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 overflow-hidden bg-gray-200 rounded-full">
              <img
                src="/logo_circle.png"
                alt="Team logo"
                title="Team logo"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {opportunity.team || 'Team'}
              </span>
              {opportunity.teamDate && (
                <span className="text-xs text-gray-500">On {opportunity.teamDate}</span>
              )}
            </div>
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200"
            onClick={onViewDetails}
          >
            View Details
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E5EFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Funds;

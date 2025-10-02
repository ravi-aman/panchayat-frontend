import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Building,
  X,
  ChevronDown,
  Loader2,
  Grid,
  List,
  SortAsc,
  SortDesc,
  RefreshCw,
  ArrowUp,
  AlertCircle,
  MapPin,
  CalendarIcon,
  Users,
  TrendingUp,
  ExternalLink,
  Award,
  Target,
  WifiOff,
  ServerCrash,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

// Define types
interface Company {
  _id: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  companySize: string;
  city: string;
  state: string;
  country: string;
  stage: string;
  establishedYear: string;
  fundedType?: string;
  website?: string;
  logo?: string;
  banner?: string;
  verified: boolean;
  superAdmin?: {
    _id: string;
    firstName: string;
    lastName: string;
    photo?: string;
  };
  ProfileId?: {
    username: string;
  };
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

interface ErrorState {
  type: 'network' | 'server' | 'not_found' | 'unknown';
  message: string;
  statusCode?: number;
}

const PAGE_SIZE = 2;
const INITIAL_FETCH_TIMEOUT_MS = 5000;

const INDUSTRIES = [
  'Technology',
  'E-commerce',
  'Fintech',
  'Healthcare',
  'Education',
  'Real Estate',
  'Automotive',
  'Food & Beverage',
  'Fashion',
  'Gaming',
  'SaaS',
  'AI/ML',
  'Blockchain',
  'Green Tech',
  'Media & Entertainment',
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const STAGES = [
  'Ideation',
  'MVP',
  'Early Stage',
  'Growth Stage',
  'Series A',
  'Series B',
  'Series C+',
  'Pre-IPO',
  'Public',
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Recently Added' },
  { value: 'name', label: 'Company Name' },
  { value: 'establishedYear', label: 'Established Year' },
  { value: 'industry', label: 'Industry' },
];

// Startup Card Component with Enhanced Mobile List View
const StartupCard = ({
  company,
  viewMode = 'grid',
}: {
  company: Company;
  viewMode?: 'grid' | 'list';
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getIndustryColor = (industry: string) => {
    const colors: Record<string, string> = {
      Technology: 'bg-blue-100 text-blue-700 border-blue-200',
      'E-commerce': 'bg-purple-100 text-purple-700 border-purple-200',
      Fintech: 'bg-green-100 text-green-700 border-green-200',
      Healthcare: 'bg-red-100 text-red-700 border-red-200',
      Education: 'bg-amber-100 text-amber-700 border-amber-200',
      'Real Estate': 'bg-orange-100 text-orange-700 border-orange-200',
      Automotive: 'bg-gray-100 text-gray-700 border-gray-200',
      default: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[industry] || colors.default;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      Ideation: 'bg-gray-100 text-gray-700',
      MVP: 'bg-blue-100 text-blue-700',
      'Early Stage': 'bg-yellow-100 text-yellow-700',
      'Growth Stage': 'bg-orange-100 text-orange-700',
      'Series A': 'bg-green-100 text-green-700',
      'Series B': 'bg-emerald-100 text-emerald-700',
      'Series C+': 'bg-purple-100 text-purple-700',
      default: 'bg-slate-100 text-slate-700',
    };
    return colors[stage] || colors.default;
  };

  const getFundingColor = (fundedType: string) => {
    const colors: Record<string, string> = {
      Bootstrapped: 'bg-blue-100 text-blue-700',
      Angel: 'bg-purple-100 text-purple-700',
      Seed: 'bg-green-100 text-green-700',
      'Series A': 'bg-orange-100 text-orange-700',
      'Series B': 'bg-red-100 text-red-700',
      'Series C+': 'bg-violet-100 text-violet-700',
      default: 'bg-gray-100 text-gray-700',
    };
    return colors[fundedType] || colors.default;
  };

  const truncateText = (text: string, length: number) => {
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  const handleViewDetails = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const slug = company.ProfileId?.username || company.slug;

    navigate(`/company/${slug}`, { state: { company } });
  };

  const handleAction = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isAuthenticated()) {
      handleViewDetails(e);
    } else {
      navigate('/auth/signin');
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        className="relative overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg group hover:border-gray-300 hover:shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Mobile-First List Layout */}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          {/* Logo Section */}
          <div className="relative self-start flex-shrink-0 sm:self-center">
            <div className="w-16 h-16 overflow-hidden border-2 border-white rounded-lg shadow-sm sm:w-20 sm:h-20 bg-gray-50">
              {company.logo && !logoError ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="object-cover w-full h-full"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white bg-blue-600 sm:text-xl">
                  {company.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {company.verified && (
              <div className="absolute flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shadow-sm sm:w-6 sm:h-6 -top-1 -right-1">
                <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-gray-900 transition-colors line-clamp-1 group-hover:text-blue-600 sm:text-xl">
                  {company.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-1 sm:text-base">{company.tagline}</p>
              </div>

              {/* Tags - Stack on mobile, inline on desktop */}
              <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:items-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${getIndustryColor(company.industry)}`}
                >
                  {company.industry}
                </span>
                {company.stage && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${getStageColor(company.stage)}`}
                  >
                    {company.stage}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2 sm:line-clamp-3">
              {truncateText(company.description, 200)}
            </p>

            {/* Bottom Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Meta Information */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 sm:gap-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {company.city}, {company.country}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 shrink-0" />
                  <span>Est. {company.establishedYear}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 shrink-0" />
                  <span>{company.companySize} employees</span>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                onClick={handleAction}
                className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 shrink-0 sm:px-6"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>View Details</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative overflow-hidden transition-all duration-500 bg-white border border-gray-200 rounded-lg group hover:border-gray-300 hover:shadow-xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Banner Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {company.banner && !imageError ? (
          <>
            <img
              src={company.banner}
              alt={`${company.name} banner`}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
            <Building className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Verification Badge */}
        {company.verified && (
          <motion.div
            className="absolute p-2 rounded-full shadow-lg top-4 right-4 bg-white/90 backdrop-blur-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Award className="w-4 h-4 text-green-600" />
          </motion.div>
        )}

        {/* Industry Tag */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-sm bg-white/90 ${getIndustryColor(company.industry)}`}
          >
            {company.industry}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div className="relative flex-shrink-0">
            <div className="relative w-16 h-16 -mt-8 overflow-hidden bg-white border-4 border-white shadow-lg rounded-xl">
              {company.logo && !logoError ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="object-cover w-full h-full"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white bg-blue-600">
                  {company.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="flex-1 min-w-0 pt-2">
            <h3 className="mb-1 text-lg font-medium text-gray-900 truncate transition-colors group-hover:text-blue-600">
              {company.name}
            </h3>
            <p className="mb-3 text-sm text-gray-600 line-clamp-1">{company.tagline}</p>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{company.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                <span>{company.establishedYear}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-600 line-clamp-3">{company.description}</p>

        {/* Tags/Badges */}
        <div className="flex flex-wrap gap-2">
          {company.stage && (
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStageColor(company.stage)}`}
            >
              <Target className="inline w-3 h-3 mr-1" />
              {company.stage}
            </span>
          )}
          {company.fundedType && (
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getFundingColor(company.fundedType)}`}
            >
              <TrendingUp className="inline w-3 h-3 mr-1" />
              {company.fundedType}
            </span>
          )}
          {company.companySize && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
              <Users className="inline w-3 h-3 mr-1" />
              {company.companySize}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          {/* Founder Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 overflow-hidden border-2 border-white rounded-full shadow-sm bg-gradient-to-br from-gray-100 to-gray-200">
                <img
                  src={company.superAdmin?.photo || '/logo_circle.png'}
                  alt="Founder"
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = '/logo_circle.png';
                  }}
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {company.superAdmin?.firstName} {company.superAdmin?.lastName}
              </p>
              <p className="text-xs text-gray-500">Founder & CEO</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {company.website && (
              <motion.a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            )}

            <motion.button
              onClick={handleAction}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>View Details</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"
            style={{ zIndex: -1 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Skeleton Components
const GridSkeleton = () => (
  <div className="overflow-hidden bg-white border border-gray-200 rounded-lg animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 -mt-8 bg-gray-300 rounded-xl"></div>
        <div className="flex-1 space-y-2">
          <div className="w-3/4 h-5 bg-gray-300 rounded"></div>
          <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
            <div className="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
      </div>

      <div className="flex gap-2">
        <div className="w-20 h-6 bg-gray-200 rounded-lg"></div>
        <div className="w-24 h-6 bg-gray-200 rounded-lg"></div>
        <div className="w-16 h-6 bg-gray-200 rounded-lg"></div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="space-y-1">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="w-24 bg-gray-200 rounded-lg h-9"></div>
        </div>
      </div>
    </div>
  </div>
);

const ListSkeleton = () => (
  <div className="p-4 bg-white border border-gray-200 rounded-lg animate-pulse sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg sm:w-20 sm:h-20"></div>
      <div className="flex-1 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="w-48 h-5 bg-gray-200 rounded sm:h-6"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-24 h-6 bg-gray-200 rounded-full"></div>
          </div>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-24 h-8 bg-gray-200 rounded-lg sm:w-32"></div>
        </div>
      </div>
    </div>
  </div>
);

const LoadingGrid = ({ viewMode }: { viewMode: 'grid' | 'list' }) => (
  <motion.div
    className={`grid gap-6 ${
      viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1'
    }`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {Array.from({ length: 4 }).map((_, index) =>
      viewMode === 'grid' ? <GridSkeleton key={index} /> : <ListSkeleton key={index} />,
    )}
  </motion.div>
);

// Enhanced Error State Component
const ErrorState = ({ error, onRetry }: { error: ErrorState; onRetry: () => void }) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="w-12 h-12 text-gray-400" />;
      case 'server':
        return <ServerCrash className="w-12 h-12 text-gray-400" />;
      case 'not_found':
        return <Building className="w-12 h-12 text-gray-400" />;
      default:
        return <AlertCircle className="w-12 h-12 text-gray-400" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Connection Problem';
      case 'server':
        return 'Server Error';
      case 'not_found':
        return 'No Startups Found';
      default:
        return 'Something Went Wrong';
    }
  };

  const getErrorDescription = () => {
    switch (error.type) {
      case 'network':
        return 'Please check your internet connection and try again.';
      case 'server':
        return 'Our servers are experiencing issues. Please try again in a moment.';
      case 'not_found':
        return 'No verified startups match your current criteria.';
      default:
        return 'An unexpected error occurred. Please try refreshing the page.';
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-center w-24 h-24 mb-6 bg-gray-100 rounded-full">
        {getErrorIcon()}
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{getErrorTitle()}</h3>
      <p className="max-w-md mx-auto mb-6 text-gray-500">{getErrorDescription()}</p>
      <motion.button
        onClick={onRetry}
        className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Try Again
      </motion.button>
    </motion.div>
  );
};

// Empty State Component
interface EmptyStateProps {
  searchQuery: string;
  hasFilters: boolean;
  onClearFilters: () => void;
}

const EmptyState = ({ searchQuery, hasFilters, onClearFilters }: EmptyStateProps) => (
  <motion.div
    className="flex flex-col items-center justify-center py-16 text-center"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="flex items-center justify-center w-24 h-24 mb-6 bg-gray-100 rounded-full">
      <Building className="w-10 h-10 text-gray-400" />
    </div>
    <h3 className="mb-2 text-lg font-medium text-gray-900">
      {searchQuery ? `No results found for "${searchQuery}"` : 'No startups found'}
    </h3>
    <p className="max-w-md mx-auto mb-6 text-gray-500">
      {hasFilters
        ? 'Try adjusting your search terms or filters to find more startups.'
        : 'No verified startups are available at the moment.'}
    </p>
    {hasFilters && (
      <motion.button
        onClick={onClearFilters}
        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Clear Filters
      </motion.button>
    )}
  </motion.div>
);

// Filter Dropdown Component
interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

const FilterDropdown = ({ label, value, options, onChange, placeholder }: FilterDropdownProps) => (
  <div className="relative">
    <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2 text-sm transition-all duration-200 bg-white border border-gray-300 rounded-md appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300"
      aria-label={label}
    >
      <option value="">{placeholder || `Select ${label}`}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute w-4 h-4 text-gray-400 pointer-events-none right-3 top-9" />
  </div>
);

// Main Component
const Startups = () => {
  // State Management
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchCompleted, setFetchCompleted] = useState(false);
  const [noData, setNoData] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Refs
  const observer = useRef<IntersectionObserver | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const lastSearchRef = useRef<string>('');

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    city: '',
    stage: '',
    companySize: '',
    establishedYear: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Generate SEO data based on current state
  const seoData = useMemo(() => {
    const baseTitle = 'Discover Innovative Startups';
    const baseDescription =
      'Explore innovative startups and groundbreaking ideas from visionary entrepreneurs around the world. Find verified companies across various industries.';

    let title = baseTitle;
    let description = baseDescription;
    const keywords = ['startups', 'entrepreneurs', 'innovation', 'business', 'companies'];

    // Customize based on active filters
    if (appliedFilters.industry) {
      title = `${appliedFilters.industry} Startups | ${baseTitle}`;
      description = `Discover innovative ${appliedFilters.industry.toLowerCase()} startups and companies. ${baseDescription}`;
      keywords.unshift(appliedFilters.industry.toLowerCase());
    }

    if (appliedFilters.search) {
      title = `${appliedFilters.search} | ${baseTitle}`;
      description = `Search results for "${appliedFilters.search}". ${baseDescription}`;
      keywords.unshift(appliedFilters.search.toLowerCase());
    }

    if (appliedFilters.city) {
      title = `Startups in ${appliedFilters.city} | ${baseTitle}`;
      description = `Find startups and innovative companies in ${appliedFilters.city}. ${baseDescription}`;
      keywords.unshift(appliedFilters.city.toLowerCase());
    }

    if (appliedFilters.stage) {
      title = `${appliedFilters.stage} Startups | ${baseTitle}`;
      description = `Discover ${appliedFilters.stage.toLowerCase()} startups and companies. ${baseDescription}`;
      keywords.unshift(appliedFilters.stage.toLowerCase());
    }

    return {
      title: `${title} - Your Platform Name`,
      description: description.substring(0, 160),
      keywords: keywords.join(', '),
      canonical: window.location.href,
      ogTitle: title,
      ogDescription: description.substring(0, 300),
      ogUrl: window.location.href,
      twitterTitle: title,
      twitterDescription: description.substring(0, 200),
    };
  }, [appliedFilters]);

  // Setup scroll listener for "scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (activeRequest.current) {
        activeRequest.current.abort();
      }
      if (initialTimeoutRef.current) {
        clearTimeout(initialTimeoutRef.current);
      }
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  // Fixed debounced search implementation
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const searchValue = filters.search.trim();

    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && lastSearchRef.current !== searchValue) {
        lastSearchRef.current = searchValue;
        setDebouncedSearch(searchValue);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.search]);

  // Apply debounced search
  useEffect(() => {
    setAppliedFilters((prev) => ({ ...prev, search: debouncedSearch }));
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch]);

  // Enhanced error handling function
  const handleApiError = (err: unknown, response?: Response) => {
    let errorState: ErrorState;

    if (!navigator.onLine) {
      errorState = {
        type: 'network',
        message: 'No internet connection detected.',
      };
    } else if (response) {
      switch (response.status) {
        case 404:
          errorState = {
            type: 'not_found',
            message: 'No startups found matching your criteria.',
            statusCode: 404,
          };
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorState = {
            type: 'server',
            message: 'Server is currently unavailable. Please try again later.',
            statusCode: response.status,
          };
          break;
        default:
          errorState = {
            type: 'unknown',
            message: `Server returned error ${response.status}. Please try again.`,
            statusCode: response.status,
          };
      }
    } else if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      return null; // Don't set error for aborted requests
    } else {
      errorState = {
        type: 'network',
        message: 'Unable to connect to server. Please check your connection and try again.',
      };
    }

    return errorState;
  };

  // Fetch startups function with enhanced error handling
  const fetchStartups = useCallback(
    async (pageNum = 1, reset = false) => {
      if (!isMountedRef.current) {
        return;
      }

      // Set loading states
      if (pageNum === 1) {
        setInitialLoading(true);
        setFetchCompleted(false);
        setNoData(false);
      }
      setLoading(true);
      setError(null);

      // Cancel any existing request
      if (activeRequest.current) {
        activeRequest.current.abort();
      }

      // Create new AbortController
      const controller = new AbortController();
      activeRequest.current = controller;

      try {
        // Start a timeout for the initial fetch only: if it takes too long, abort and show empty state
        if (pageNum === 1) {
          if (initialTimeoutRef.current) clearTimeout(initialTimeoutRef.current);
          initialTimeoutRef.current = setTimeout(() => {
            // If still loading, abort and treat as no data (user asked for this behavior)
            if (activeRequest.current) {
              activeRequest.current.abort();
            }
            if (isMountedRef.current) {
              setLoading(false);
              setInitialLoading(false);
              setFetchCompleted(true);
              setNoData(true);
            }
          }, INITIAL_FETCH_TIMEOUT_MS);
        }

        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('page', pageNum.toString());
        queryParams.append('limit', PAGE_SIZE.toString());

        // Add filters to query params
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value && value.toString().trim()) {
            queryParams.append(key, value.toString().trim());
          }
        });

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/startup/verified?${queryParams.toString()}`,
          {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          const errorState = handleApiError(null, response);
          if (errorState) {
            // Handle 404 specially - it's not an error, just no results
            if (response.status === 404) {
              if (reset || pageNum === 1) {
                setCompanies([]);
              }
              setHasMore(false);
              setTotalCompanies(0);
              setRetryCount(0);
              if (pageNum === 1) {
                setFetchCompleted(true);
                setNoData(true);
              }
              return;
            }
            throw { errorState, response };
          }
          return;
        }

        const data = await response.json();

        if (!isMountedRef.current) return;

        if (data.status === 'success' && Array.isArray(data.companies)) {
          const newCompanies = data.companies;

          if (reset || pageNum === 1) {
            setCompanies(newCompanies);
          } else {
            setCompanies((prev) => [...prev, ...newCompanies]);
          }

          setHasMore(data.pagination.hasNext);
          setPage(pageNum);
          setTotalCompanies(data.pagination.totalVerifiedCompanies);
          setRetryCount(0);
          if (pageNum === 1) {
            setFetchCompleted(true);
            setNoData(!Array.isArray(newCompanies) || newCompanies.length === 0);
          }
          // clear initial timeout on successful response
          if (pageNum === 1 && initialTimeoutRef.current) {
            clearTimeout(initialTimeoutRef.current);
            initialTimeoutRef.current = null;
          }
        } else {
          throw { errorState: { type: 'unknown', message: 'Invalid response format' } };
        }
      } catch (error: unknown) {
        if (!isMountedRef.current) return;

        const err = error as Error & { errorState?: ErrorState; response?: Response };

        // Handle aborted requests
        if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
          return;
        }

        console.error('Error fetching startups:', err);

        const errorState =
          err && 'errorState' in err
            ? err.errorState
            : handleApiError(
                err,
                err && typeof err === 'object' && 'response' in err ? err.response : undefined,
              );

        if (errorState) {
          // Only retry for network errors, not for client/server errors
          if (errorState.type === 'network' && retryCount < 3) {
            setRetryCount((prev) => prev + 1);
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
            setTimeout(() => {
              if (isMountedRef.current) {
                fetchStartups(pageNum, reset);
              }
            }, delay);
          } else {
            setError(errorState);
            if (pageNum === 1) {
              // on error keep companies as-is (empty or previous) but mark fetch completed
              setCompanies((prev) => (reset ? [] : prev));
              setFetchCompleted(true);
              // do not mark noData; errors shouldn't show empty state
            }
            setRetryCount(0);
          }
        }
      } finally {
        if (activeRequest.current === controller) {
          activeRequest.current = null;
        }
        setLoading(false);
        setInitialLoading(false);
        if (initialTimeoutRef.current) {
          clearTimeout(initialTimeoutRef.current);
          initialTimeoutRef.current = null;
        }
        // If fetch finished due to finally without fetchCompleted set, mark completed for page 1
        if (pageNum === 1) setFetchCompleted(true);
        setRefreshing(false);
      }
    },
    [appliedFilters, retryCount],
  );

  // Apply filters handler
  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setPage(1);
    setHasMore(true);
    setShowFilters(false);
  }, [filters]);

  // Clear filters handler
  const clearFilters = useCallback(() => {
    const resetFilters = {
      search: '',
      industry: '',
      city: '',
      stage: '',
      companySize: '',
      establishedYear: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setPage(1);
    setHasMore(true);
    setDebouncedSearch('');
    lastSearchRef.current = '';
  }, []);

  // Refresh data handler
  const refreshData = useCallback(() => {
    setRefreshing(true);
    setRetryCount(0);
    setError(null);
    fetchStartups(1, true);
  }, [fetchStartups]);

  // Infinite scroll setup
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading && isMountedRef.current) {
            fetchStartups(page + 1);
          }
        },
        {
          threshold: 0.1,
          rootMargin: '100px',
        },
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, page, fetchStartups],
  );

  // Effect to fetch data when applied filters change
  useEffect(() => {
    if (isMountedRef.current) {
      fetchStartups(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // Handle sort order toggle
  const toggleSortOrder = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Apply filters when sort changes
  useEffect(() => {
    const { sortBy, sortOrder, ...otherFilters } = filters;
    const {
      sortBy: appliedSortBy,
      sortOrder: appliedSortOrder,
      ...otherAppliedFilters
    } = appliedFilters;

    // Check if sort options changed
    if (sortBy !== appliedSortBy || sortOrder !== appliedSortOrder) {
      // Only update if other filters haven't changed
      const otherFiltersStr = JSON.stringify(otherFilters);
      const otherAppliedFiltersStr = JSON.stringify(otherAppliedFilters);

      if (otherFiltersStr === otherAppliedFiltersStr) {
        setAppliedFilters(filters);
        setPage(1);
        setHasMore(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sortBy, filters.sortOrder, appliedFilters]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    return Object.entries(appliedFilters).filter(
      ([key, value]) => key !== 'sortBy' && key !== 'sortOrder' && value && value.toString().trim(),
    ).length;
  }, [appliedFilters]);

  // Handle scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Update document title directly
  useEffect(() => {
    document.title = seoData.title;
  }, [seoData.title]);

  return (
    <>
      <div className="min-h-screen w-full bg-[#F3F4F6] relative z-0">
        {/* Header Section */}
        <motion.div
          className="relative py-4 bg-[#F3F4F6] border-b border-gray-100"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-full px-4">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Title and Description */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <motion.h1
                    className="text-3xl font-bold text-gray-800"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Government Departments
                  </motion.h1>
                </div>
                <motion.p
                  className="max-w-2xl text-lg leading-relaxed text-gray-600"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Discover and connect with essential government departments, their services, and local authorities
                </motion.p>

                {/* Stats */}
                <motion.div
                  className="flex flex-wrap gap-4 text-sm text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{totalCompanies} verified startups</span>
                  </div>
                  {appliedFilters.search && (
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      <span>Searching for "{appliedFilters.search}"</span>
                    </div>
                  )}
                  {appliedFilters.industry && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-500" />
                      <span>Industry: {appliedFilters.industry}</span>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Action Buttons */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 transition-all duration-200 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </motion.button>

                {/* <motion.button
                  className="bg-[#1E5EFF] rounded-sm p-2 flex gap-1 text-white font-semibold px-3 transition-all duration-300 hover:bg-blue-700 active:scale-95 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    (window.location.href = isAuthenticated()
                      ? '/startup/register'
                      : '/auth/signin')
                  }
                >
                  <h1 className="text">Create Startup</h1>
                  <Plus className="self-center w-5 h-5" />
                </motion.button> */}
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="w-full px-4 py-2 relative z-0">
          {/* Search and Filter Controls */}
          <motion.div
            className="flex flex-col gap-4 mb-5 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Enhanced Search */}
            <motion.div
              className="relative flex-1 bg-white border border-gray-300 rounded-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <input
                type="text"
                placeholder="Search startups by name, description, location, or industry..."
                className="w-full px-4 py-2 pl-12 text-gray-900 placeholder-gray-500 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                {loading && filters.search !== appliedFilters.search ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 text-gray-400" />
                )}
              </div>
              {filters.search && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>

            {/* Controls group */}
            <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              {/* Filters Button */}
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all duration-200 whitespace-nowrap text-sm ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold text-blue-800 bg-blue-100 rounded-full min-w-[20px] text-center">
                    {activeFiltersCount}
                  </span>
                )}
              </motion.button>

              {/* View Mode Toggle */}
              <motion.div
                className="flex items-center p-1 bg-white border border-gray-300 rounded-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-all ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-all ${
                    viewMode === 'list'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </motion.div>

              {/* Sort Controls */}
              <motion.div
                className="flex items-center gap-2 whitespace-nowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Sort by"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={toggleSortOrder}
                  className="p-2 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-300"
                  title={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
                >
                  {filters.sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </motion.div>

              {/* Clear Filters */}
              <AnimatePresence>
                {activeFiltersCount > 0 && (
                  <motion.button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-red-600 transition-colors bg-white border border-red-200 rounded-md hover:bg-red-50 whitespace-nowrap"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="inline w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Clear All</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="p-6 bg-white border border-gray-300 rounded-md">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <FilterDropdown
                      label="Industry"
                      value={filters.industry}
                      options={INDUSTRIES}
                      onChange={(value) => setFilters((prev) => ({ ...prev, industry: value }))}
                      placeholder="Select Industry"
                    />

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={filters.city}
                        onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="Enter city name"
                        className="w-full px-4 py-2 text-sm transition-all duration-200 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <FilterDropdown
                      label="Stage"
                      value={filters.stage}
                      options={STAGES}
                      onChange={(value) => setFilters((prev) => ({ ...prev, stage: value }))}
                      placeholder="Select Stage"
                    />

                    <FilterDropdown
                      label="Company Size"
                      value={filters.companySize}
                      options={COMPANY_SIZES}
                      onChange={(value) => setFilters((prev) => ({ ...prev, companySize: value }))}
                      placeholder="Select Company Size"
                    />

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Established Year
                      </label>
                      <input
                        type="number"
                        value={filters.establishedYear}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, establishedYear: e.target.value }))
                        }
                        placeholder="e.g., 2020"
                        min="1800"
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-2 text-sm transition-all duration-200 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-2 text-sm text-gray-600 transition-colors rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <motion.button
                      onClick={applyFilters}
                      className="px-4 py-2 text-sm text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Apply Filters
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ErrorState error={error} onRetry={() => fetchStartups(1, true)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence mode="wait">
            {initialLoading ? (
              <LoadingGrid viewMode={viewMode} key="loading" />
            ) : error ? (
              <div key="error" /> // Error already shown above
            ) : noData && fetchCompleted && !initialLoading && !loading ? (
              <EmptyState
                key="empty"
                searchQuery={appliedFilters.search}
                hasFilters={activeFiltersCount > 0}
                onClearFilters={clearFilters}
              />
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Results Header */}
                {companies.length > 0 && (
                  <motion.div
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-gray-600">
                      Showing <span className="font-medium">{companies.length}</span> of{' '}
                      <span className="font-medium">{totalCompanies}</span> startups
                    </p>
                    <div className="text-sm text-gray-500">Updated just now</div>
                  </motion.div>
                )}

                {/* Results Grid */}
                <motion.div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
                      : 'grid-cols-1'
                  }`}
                  layout
                >
                  <AnimatePresence>
                    {companies.map((company, index) => (
                      <motion.div
                        key={company._id}
                        layout
                        className="w-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          delay: index * 0.1,
                          layout: { duration: 0.3 },
                        }}
                        ref={index === companies.length - 1 ? lastElementRef : undefined}
                      >
                        <StartupCard company={company} viewMode={viewMode} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Loading More Indicator */}
                <AnimatePresence>
                  {loading && !initialLoading && (
                    <motion.div
                      className="flex justify-center py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 px-6 py-3 bg-white border rounded-full">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <span className="text-sm text-gray-700">Loading more startups...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* End of Results */}
                {!hasMore && companies.length > 0 && !loading && (
                  <motion.div
                    className="py-12 mt-8 text-center border-t border-gray-100"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                      <Award className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="mb-2 text-lg font-medium text-gray-900">That's all for now!</p>
                    <p className="text-gray-500">
                      You've discovered all {companies.length} verified startups. Check back later
                      for new additions!
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll to top button */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                className="fixed p-3 text-white bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 bottom-6 right-6 hover:shadow-xl"
                style={{ zIndex: 1000 }}
                onClick={scrollToTop}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Scroll to top"
              >
                <ArrowUp className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Startups;

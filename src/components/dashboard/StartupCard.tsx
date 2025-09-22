import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ChevronRight,
  MapPin,
  Users,
  Building,
  TrendingUp,
  ExternalLink,
  Award,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Company } from '../../types/company';

interface AdvancedStartupCardProps {
  company: Company;
  viewMode?: 'grid' | 'list';
}

const AdvancedStartupCard: React.FC<AdvancedStartupCardProps> = ({
  company,
  viewMode = 'grid',
}) => {
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use company slug from ProfileId.username if available, otherwise fallback to company.slug
    const slug = company.ProfileId?.username || company.slug;
    navigate(`/company/${slug}`, { state: { company } });
  };

  const getIndustryColor = (industry: string) => {
    const colors = {
      Technology: 'bg-blue-100 text-blue-700 border-blue-200',
      'E-commerce': 'bg-purple-100 text-purple-700 border-purple-200',
      Fintech: 'bg-green-100 text-green-700 border-green-200',
      Healthcare: 'bg-red-100 text-red-700 border-red-200',
      Education: 'bg-amber-100 text-amber-700 border-amber-200',
      'Real Estate': 'bg-orange-100 text-orange-700 border-orange-200',
      Automotive: 'bg-gray-100 text-gray-700 border-gray-200',
      default: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[industry as keyof typeof colors] || colors.default;
  };

  const getStageColor = (stage: string) => {
    const colors = {
      Ideation: 'bg-gray-100 text-gray-700',
      MVP: 'bg-blue-100 text-blue-700',
      'Early Stage': 'bg-yellow-100 text-yellow-700',
      'Growth Stage': 'bg-orange-100 text-orange-700',
      'Series A': 'bg-green-100 text-green-700',
      'Series B': 'bg-emerald-100 text-emerald-700',
      'Series C+': 'bg-purple-100 text-purple-700',
      default: 'bg-slate-100 text-slate-700',
    };
    return colors[stage as keyof typeof colors] || colors.default;
  };

  const getFundingColor = (fundedType: string) => {
    const colors = {
      Bootstrapped: 'bg-blue-100 text-blue-700',
      Angel: 'bg-purple-100 text-purple-700',
      Seed: 'bg-green-100 text-green-700',
      'Series A': 'bg-orange-100 text-orange-700',
      'Series B': 'bg-red-100 text-red-700',
      'Series C+': 'bg-violet-100 text-violet-700',
      default: 'bg-gray-100 text-gray-700',
    };
    return colors[fundedType as keyof typeof colors] || colors.default;
  };

  const truncateText = (text: string, length: number) => {
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  if (loading) {
    return <SkeletonContent viewMode={viewMode} />;
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        className="relative overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-md group hover:border-gray-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          boxShadow: isHovered ? '0 10px 24px rgba(0,0,0,0.08)' : '0 4px 10px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center gap-6 p-6">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 overflow-hidden border-2 border-white rounded-md shadow-sm bg-gray-50">
              {!logoError ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="object-cover w-full h-full"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-xl font-bold text-white bg-blue-600">
                  {company.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {company.verified && (
              <div className="absolute flex items-center justify-center w-6 h-6 bg-green-500 rounded-full shadow-sm -top-1 -right-1">
                <Award className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="mb-1 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
                  {company.name}
                </h3>
                <p className="text-sm font-medium text-gray-600">{company.tagline}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getIndustryColor(company.industry)}`}
                >
                  {company.industry}
                </span>
                {company.stage && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(company.stage)}`}
                  >
                    {company.stage}
                  </span>
                )}
              </div>
            </div>

            <p className="mb-4 text-sm text-gray-600 line-clamp-2">
              {truncateText(company.description, 120)}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {company.city}, {company.country}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  <span>Est. {company.establishedYear}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{company.companySize} employees</span>
                </div>
              </div>

              <motion.button
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                className="text-blue-600 text-sm cursor-pointer font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors hover:bg-blue-50 border border-transparent hover:border-blue-100"
                onClick={(e) =>
                  isAuthenticated() ? handleViewDetails(e) : navigate('/auth/signin')
                }
              >
                <span>View Details</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative overflow-hidden transition-all duration-500 bg-white border border-gray-200 rounded-lg group hover:border-gray-300"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered ? '0 14px 34px rgba(0,0,0,0.10)' : '0 6px 18px rgba(0,0,0,0.06)',
      }}
    >
      {/* Banner Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {company.banner && !imageError ? (
          <>
            <img
              src={company.banner}
              alt={`${company.name} banner`}
              className="object-cover w-full h-full transition-transform duration-400"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <Building className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Verification Badge */}
        {company.verified && (
          <motion.div
            className="absolute p-2 rounded-full shadow-sm top-4 right-4 bg-white/90 backdrop-blur-sm"
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
            className={`px-3 py-1 rounded-md text-xs font-semibold border backdrop-blur-sm bg-white/90 ${getIndustryColor(company.industry)}`}
          >
            {company.industry}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div className="relative flex-shrink-0">
            <div className="relative w-16 h-16 -mt-8 overflow-hidden bg-white border-2 border-white rounded-md shadow-sm">
              {!logoError ? (
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
            <h3 className="mb-1 text-xl font-bold text-gray-900 truncate transition-colors group-hover:text-blue-600">
              {company.name}
            </h3>
            <p className="mb-2 text-sm font-medium text-gray-600 line-clamp-1">{company.tagline}</p>

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
              className={`px-2.5 py-1 rounded-sm text-xs font-medium ${getStageColor(company.stage)}`}
            >
              <Target className="inline w-3 h-3 mr-1" />
              {company.stage}
            </span>
          )}
          {company.fundedType && (
            <span
              className={`px-2.5 py-1 rounded-sm text-xs font-medium ${getFundingColor(company.fundedType)}`}
            >
              <TrendingUp className="inline w-3 h-3 mr-1" />
              {company.fundedType}
            </span>
          )}
          {company.companySize && (
            <span className="px-2.5 py-1 rounded-sm text-xs font-medium bg-slate-100 text-slate-700">
              <Users className="inline w-3 h-3 mr-1" />
              {company.companySize}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Footer */}
        <div className="flex items-center justify-between">
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
              <p className="text-sm font-semibold text-gray-900">
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
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              className="text-blue-600 text-sm cursor-pointer font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors hover:bg-blue-50 border border-transparent hover:border-blue-100"
              onClick={(e) => (isAuthenticated() ? handleViewDetails(e) : navigate('/auth/signin'))}
            >
              <span>View Details</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Skeleton Component
const SkeletonContent: React.FC<{ viewMode: 'grid' | 'list' }> = ({ viewMode }) => {
  if (viewMode === 'list') {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-2xl">
        <div className="flex items-center gap-6">
          <Skeleton className="flex-shrink-0 w-20 h-20 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="w-48 h-6" />
                <Skeleton className="w-32 h-4" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-20 h-6 rounded-full" />
                <Skeleton className="w-24 h-6 rounded-full" />
              </div>
            </div>
            <Skeleton className="w-full h-4" />
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
              <Skeleton className="w-24 h-8 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-3xl">
      <Skeleton className="w-full h-48" />
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <Skeleton className="flex-shrink-0 w-16 h-16 -mt-8 rounded-2xl" />
          <div className="flex-1 pt-2 space-y-2">
            <Skeleton className="w-3/4 h-6" />
            <Skeleton className="w-1/2 h-4" />
            <div className="flex gap-3">
              <Skeleton className="w-16 h-3" />
              <Skeleton className="w-12 h-3" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-3/4 h-4" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="w-20 h-6 rounded-lg" />
          <Skeleton className="w-24 h-6 rounded-lg" />
          <Skeleton className="w-16 h-6 rounded-lg" />
        </div>

        <div className="pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStartupCard;

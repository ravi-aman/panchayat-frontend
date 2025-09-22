import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../../utils/api';
import { getCompanyData } from '../../../utils/companyHelpers';

import {
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaChartLine,
  FaUserFriends,
  FaArrowLeft,
  FaCheckCircle,
  FaUsers,
  FaCalendarAlt,
  FaBullhorn,
  FaHeart,
  FaHeartBroken,
  FaSpinner,
  FaExclamationTriangle,
  FaUserTie,
} from 'react-icons/fa';
import { BsBuilding, BsCalendarEvent, BsShield } from 'react-icons/bs';
import { MdLocationCity, MdVerified, MdBusiness } from 'react-icons/md';
import { FiTrendingUp, FiUsers, FiDollarSign, FiMapPin } from 'react-icons/fi';
import { HiOutlineBadgeCheck } from 'react-icons/hi';
import { MapPin, ExternalLink, Users, Building2, Globe, Briefcase } from 'lucide-react';
import CompanyMetricsDashboard from '../../../components/dashboard/charts';
import { Company } from '../../../types/company';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface FollowStatus {
  isFollowing: boolean;
  followersCount: number;
  isLoading: boolean;
}

const AdvancedFollowButton: React.FC<{
  companyProfile: string;
  companyName: string;
  followStatus: FollowStatus;
  onFollowChange: (newStatus: FollowStatus) => void;
  size?: 'small' | 'medium' | 'large';
}> = ({ companyProfile, companyName, followStatus, onFollowChange, size = 'medium' }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { user, activeProfile, accessToken, isAuthenticated } = useAuth();

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-2 text-sm',
    large: 'px-8 py-3 text-base',
  };

  // Get follower ID based on active profile or user
  const getFollowerId = () => {
    if (activeProfile) {
      // If activeProfile is a company profile, use the profile ID directly
      // If activeProfile is a user profile, use the profile ID directly
      return activeProfile._id;
    }
    return user?._id;
  };

  // Check if current user/profile can follow
  const canFollow = () => {
    const followerId = getFollowerId();
    return followerId && companyProfile && followerId !== companyProfile; // Can't follow yourself
  };

  // Get current user/profile display info
  const getCurrentUserInfo = () => {
    if (activeProfile) {
      return {
        type: activeProfile.type,
        name:
          activeProfile.type === 'company'
            ? activeProfile.username
            : `${user?.firstName} ${user?.lastName}`,
        image: activeProfile.image || user?.photo,
      };
    }
    return {
      type: 'user',
      name: user ? `${user.firstName} ${user.lastName}` : 'Guest',
      image: user?.photo,
    };
  };

  const handleFollowToggle = async () => {
    // Check authentication first
    if (!isAuthenticated() || !user || !accessToken) {
      toast.error(
        <div className="flex items-center space-x-2">
          <FaExclamationTriangle className="text-yellow-500" />
          <span>Please login to follow this startup</span>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B',
          },
        },
      );
      navigate('/auth/signin');
      return;
    }

    const followerId = getFollowerId();

    if (!followerId) {
      toast.error('Unable to determine follower profile');
      return;
    }

    // Check if trying to follow self
    if (followerId === companyProfile) {
      toast.error(
        <div className="flex items-center space-x-2">
          <FaExclamationTriangle className="text-red-500" />
          <span>You cannot follow your own company</span>
        </div>,
        {
          duration: 3000,
          style: {
            background: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #EF4444',
          },
        },
      );
      return;
    }

    if (!companyProfile) {
      toast.error('Company profile not available for following');
      return;
    }

    if (followStatus.isLoading) return;

    setIsAnimating(true);

    const newStatus: FollowStatus = {
      ...followStatus,
      isLoading: true,
    };
    onFollowChange(newStatus);

    try {
      const endpoint = followStatus.isFollowing
        ? `${import.meta.env.VITE_BACKEND_URL}/api/v1/social/profile/unfollow`
        : `${import.meta.env.VITE_BACKEND_URL}/api/v1/social/profile/follow`;

      const response = await api.post(
        endpoint,
        {
          targetId: companyProfile, // Use company's profile ID instead of company ID
          followerId: followerId, //active profile id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.data.status === 'success') {
        const updatedStatus: FollowStatus = {
          isFollowing: !followStatus.isFollowing,
          followersCount: response.data.followersCount,
          isLoading: false,
        };

        onFollowChange(updatedStatus);

        const userInfo = getCurrentUserInfo();

        // Show success toast with  styling and user info
        if (updatedStatus.isFollowing) {
          toast.success(
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500">
                  <FaHeart className="text-sm text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Following {companyName}!</p>
                <p className="text-sm text-gray-600">
                  As {userInfo.name} ({userInfo.type})
                </p>
              </div>
            </div>,
            {
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '12px',
                padding: '16px',
              },
            },
          );
        } else {
          toast.success(
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-pink-500">
                  <FaHeartBroken className="text-sm text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Unfollowed {companyName}</p>
                <p className="text-sm text-gray-600">You can follow them again anytime</p>
              </div>
            </div>,
            {
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: 'white',
                borderRadius: '12px',
                padding: '16px',
              },
            },
          );
        }

        setTimeout(() => setIsAnimating(false), 600);
      }
    } catch (error: any) {
      console.error('Error toggling follow status:', error);

      // Reset loading state
      const resetStatus: FollowStatus = {
        ...followStatus,
        isLoading: false,
      };
      onFollowChange(resetStatus);

      //  error handling - show backend error messages
      const errorMessage = error.response?.data?.message;

      if (error.response?.status === 401) {
        toast.error(
          <div className="flex items-center space-x-2">
            <FaExclamationTriangle className="text-red-500" />
            <div>
              <p className="font-semibold">Authentication expired</p>
              <p className="text-sm">Please login again to continue</p>
            </div>
          </div>,
          {
            duration: 5000,
            style: {
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #EF4444',
            },
          },
        );
        navigate('/auth/signin');
      } else if (errorMessage) {
        // Show specific backend error messages
        toast.error(errorMessage, {
          duration: 4000,
          style: {
            background: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #EF4444',
          },
        });
      } else {
        toast.error(
          <div className="flex items-center space-x-2">
            <FaExclamationTriangle className="text-red-500" />
            <span>Failed to update follow status. Please try again.</span>
          </div>,
          {
            duration: 4000,
          },
        );
      }

      setIsAnimating(false);
    }
  };

  // Render login button for unauthenticated users
  if (!isAuthenticated() || !user) {
    return (
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          onClick={() => navigate('/auth/signin')}
          className={`${sizeClasses[size]} font-semibold text-white transition-all bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105`}
        >
          <FaHeart className="w-4 h-4 mr-2" />
          Login to Follow
        </button>
      </motion.div>
    );
  }

  if (!canFollow()) {
    return (
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <button
          disabled
          className={`${sizeClasses[size]} flex justify-center items-center font-semibold text-gray-500 bg-gray-200 rounded-full cursor-not-allowed opacity-60`}
        >
          <FaUserTie className="w-4 h-4 mr-2" />
          Your Company
        </button>
      </motion.div>
    );
  }

  const userInfo = getCurrentUserInfo();

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="flex items-center space-x-3"
    >
      <motion.div
        animate={
          isAnimating
            ? {
                scale: [1, 1.1, 1],
              }
            : {}
        }
        transition={{ duration: 0.6 }}
      >
        <button
          onClick={handleFollowToggle}
          disabled={followStatus.isLoading}
          className={`px-4 py-1.5 text-sm font-medium rounded-full shadow-md transition-all duration-300 ${
            followStatus.isFollowing
              ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white hover:shadow-red-200'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
          } hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 group`}
        >
          {followStatus.isLoading ? (
            <div className="flex items-center space-x-1.5">
              <FaSpinner className="w-3 h-3 animate-spin" />
              <span className="text-xs">
                {followStatus.isFollowing ? 'Unfollowing...' : 'Following...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5">
              <motion.div
                animate={
                  isAnimating
                    ? {
                        scale: [1, 1.3, 1],
                      }
                    : {}
                }
                transition={{ duration: 0.5 }}
                className="transition-transform group-hover:scale-110"
              >
                {followStatus.isFollowing ? (
                  <FaHeartBroken className="w-3 h-3" />
                ) : (
                  <FaHeart className="w-3 h-3" />
                )}
              </motion.div>
              <span className="text-xs">{followStatus.isFollowing ? 'Unfollow' : 'Follow'}</span>
            </div>
          )}
        </button>
      </motion.div>

      <motion.div
        animate={{
          scale: isAnimating ? [1, 1.2, 1] : 1,
          y: isAnimating ? [0, -5, 0] : 0,
        }}
        transition={{ duration: 0.6 }}
        className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 transition-colors bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 group"
        whileHover={{ scale: 1.05 }}
        title={`${followStatus.followersCount} ${followStatus.followersCount === 1 ? 'follower' : 'followers'}`}
      >
        <FaUsers className="w-2.5 h-2.5 mr-1 transition-colors group-hover:text-blue-600" />
        <motion.span
          key={followStatus.followersCount}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="transition-colors group-hover:text-blue-600"
        >
          {followStatus.followersCount}{' '}
          {followStatus.followersCount === 1 ? 'Follower' : 'Followers'}
        </motion.span>
      </motion.div>

      {/* Active Profile Indicator */}
      {activeProfile && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center px-1.5 py-0.5 text-xs text-gray-500 border rounded-full bg-gray-50"
          title={`Following as ${userInfo.name} (${userInfo.type})`}
        >
          <div className="flex items-center justify-center w-3 h-3 mr-1 rounded-full bg-gradient-to-r from-green-400 to-blue-500">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <span className="hidden text-xs sm:inline">{userInfo.type}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

const FollowStatusIndicator: React.FC<{
  isFollowing: boolean;
  companyName: string;
}> = ({ isFollowing }) => {
  const { user, activeProfile } = useAuth();

  if (!isFollowing) return null;

  const userInfo = activeProfile
    ? { name: activeProfile.username, type: activeProfile.type }
    : { name: user ? `${user.firstName} ${user.lastName}` : 'You', type: 'user' };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 20 }}
      className="flex items-center space-x-1"
    >
      <motion.span
        className="flex items-center px-3 py-1 text-xs font-medium text-white rounded-full shadow-lg bg-gradient-to-r from-green-500 to-emerald-600"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(34, 197, 94, 0.4)',
            '0 0 0 8px rgba(34, 197, 94, 0)',
            '0 0 0 0 rgba(34, 197, 94, 0)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        title={`${userInfo.name} is following this company`}
      >
        <FaCheckCircle className="w-3 h-3 mr-1" />
        FOLLOWING
      </motion.span>
    </motion.div>
  );
};

const VerificationBadge: React.FC<{ verified: boolean; status: string }> = ({
  verified,
  status,
}) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.6 }}
    className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      verified && status === 'approved'
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800'
    }`}
  >
    {verified && status === 'approved' ? (
      <>
        <MdVerified className="w-4 h-4 mr-1" />
        Verified
      </>
    ) : (
      <>
        <BsShield className="w-4 h-4 mr-1" />
        Pending
      </>
    )}
  </motion.div>
);

interface TeamMember {
  _id?: string;
  userId: {
    _id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    photo?: string;
  };
  role: string;
}

const TeamMemberCard: React.FC<{ member: TeamMember; isFounder?: boolean }> = ({
  member,
  isFounder = false,
}) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
    className="p-4 sm:p-6 transition-all bg-white border border-gray-100 shadow-sm rounded-xl hover:border-blue-200"
  >
    <div className="flex items-center space-x-3 sm:space-x-4">
      <div className="relative flex-shrink-0">
        <img
          src={member.userId.photo || '/placeholder-profile.png'}
          alt={`${member.userId.firstName} ${member.userId.lastName}`}
          className="object-cover w-12 h-12 sm:w-16 sm:h-16 border-white rounded-full shadow-md border-3"
        />
        {isFounder && (
          <div className="absolute p-1 bg-yellow-400 rounded-full -top-1 -right-1">
            <FaBullhorn className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pl-1">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
          {member.userId.firstName} {member.userId.lastName}
        </h4>
        <p className="text-sm sm:text-base font-medium text-blue-600 capitalize truncate">
          {isFounder ? 'Founder & CEO' : member.role}
        </p>
        <div className="flex flex-col mt-1 sm:mt-2 space-y-1 text-xs sm:text-sm text-gray-500">
          {member.userId.email && (
            <div className="flex items-center min-w-0">
              <FaEnvelope className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-2 flex-shrink-0" />
              <span className="truncate">{member.userId.email}</span>
            </div>
          )}
          {member.userId.phone && (
            <div className="flex items-center min-w-0">
              <FaPhone className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-2 flex-shrink-0" />
              <span className="truncate">{member.userId.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

const SocialMediaGrid: React.FC<{ socialLinks: string[] }> = ({ socialLinks }) => {
  const getSocialPlatform = (url: string) => {
    if (url.includes('linkedin'))
      return { name: 'LinkedIn', icon: FaLinkedin, color: 'text-blue-600', bg: 'bg-blue-100' };
    if (url.includes('twitter') || url.includes('x.com'))
      return { name: 'Twitter', icon: FaTwitter, color: 'text-blue-400', bg: 'bg-blue-100' };
    if (url.includes('facebook'))
      return { name: 'Facebook', icon: FaFacebook, color: 'text-blue-800', bg: 'bg-blue-100' };
    if (url.includes('instagram'))
      return { name: 'Instagram', icon: FaInstagram, color: 'text-pink-600', bg: 'bg-pink-100' };
    return { name: 'Website', icon: FaGlobe, color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {socialLinks.map((link, index) => {
        const platform = getSocialPlatform(link);
        const IconComponent = platform.icon;

        return (
          <motion.a
            key={index}
            href={link.startsWith('http') ? link : `https://${link}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${platform.bg} ${platform.color} p-4 rounded-xl text-center hover:shadow-md transition-all`}
          >
            <IconComponent className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">{platform.name}</p>
          </motion.a>
        );
      })}
    </div>
  );
};

const CompanyStatsGrid: React.FC<{ company: Company }> = ({ company }) => {
  const stats = [
    {
      label: 'Industry',
      value: company.industry,
      icon: BsBuilding,
      color: 'blue',
      description: 'Primary business sector',
    },
    {
      label: 'Team Size',
      value: company.companySize,
      icon: FiUsers,
      color: 'green',
      description: 'Number of employees',
    },
    {
      label: 'Location',
      value: `${company.city}, ${company.state}`,
      icon: MdLocationCity,
      color: 'purple',
      description: 'Headquarters location',
    },
    {
      label: 'Founded',
      value: company.establishedYear,
      icon: BsCalendarEvent,
      color: 'amber',
      description: 'Year of establishment',
    },
    {
      label: 'Stage',
      value: company.stage,
      icon: FiTrendingUp,
      color: 'indigo',
      description: 'Current business stage',
    },
    {
      label: 'Team Members',
      value: company.teamMembers?.length || 1,
      icon: FaUsers,
      color: 'rose',
      description: 'Active team members',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-50 to-blue-100 text-blue-700 bg-blue-200',
      green: 'from-green-50 to-green-100 text-green-700 bg-green-200',
      purple: 'from-purple-50 to-purple-100 text-purple-700 bg-purple-200',
      amber: 'from-amber-50 to-amber-100 text-amber-700 bg-amber-200',
      indigo: 'from-indigo-50 to-indigo-100 text-indigo-700 bg-indigo-200',
      rose: 'from-rose-50 to-rose-100 text-rose-700 bg-rose-200',
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        const colorClasses = getColorClasses(stat.color);

        return (
          <motion.div
            key={index}
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 },
            }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-gradient-to-br ${colorClasses.split(' ').slice(0, 2).join(' ')} p-6 rounded-xl shadow-sm hover:shadow-md transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${colorClasses.split(' ').slice(2).join(' ')} p-3 rounded-lg`}>
                <IconComponent className={`${colorClasses.split(' ')[2]} text-xl`} />
              </div>
              <div className="text-right">
                <p className="text-xs tracking-wide text-gray-500 uppercase">{stat.label}</p>
              </div>
            </div>
            <p className="mb-1 text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

const StartupDetails: React.FC = () => {
  const { slug, username } = useParams<{ slug?: string; username?: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const location = useLocation();
  const { user, activeProfile, accessToken, isAuthenticated } = useAuth();

  // Use username from company/:username route or slug from startups/:slug route
  const companyIdentifier = username || slug;
  const initialCompany = state?.company ? getCompanyData(state) : null;
  const [company, setCompany] = useState<Company | null>(initialCompany);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    followersCount: 0,
    isLoading: true,
  });

  // Memoize whether we should fetch - only when company is null and we have identifier
  const shouldFetch = useMemo(() => {
    return !company && companyIdentifier;
  }, [company, companyIdentifier]);

  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    const validTabs = ['overview', 'metrics', 'team', 'jobs', 'contact'];
    return validTabs.includes(tab || '') ? tab : 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl());

  const updateTabInUrl = (newTab: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', newTab);
    // Don't use navigate for tab changes, just update the URL and local state
    window.history.replaceState(
      window.history.state,
      '',
      `${location.pathname}?${searchParams.toString()}`,
    );
    setActiveTab(newTab);
  };

  // Sync activeTab with URL changes (for direct access with tab parameter)
  useEffect(() => {
    const currentTab = getTabFromUrl();
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [location.search]); // Only depend on search params, not activeTab to avoid loops

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  useEffect(() => {
    const checkRelationshipStatus = async () => {
      if (!company || !company.ProfileId?._id) {
        setFollowStatus((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      if (!isAuthenticated() || !user) {
        setFollowStatus({
          isFollowing: false,
          followersCount: company.ProfileId?.followers?.length || 0,
          isLoading: false,
        });
        return;
      }

      // Get follower ID for API calls
      const getFollowerId = () => {
        if (activeProfile) {
          // Use the active profile ID directly for both user and company profiles
          return activeProfile._id;
        }
        return user?._id;
      };

      const followerId = getFollowerId();
      if (!followerId) {
        setFollowStatus((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Use smart relationship API - single request to get all data
        const response = await api.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/social/profile/relationship`,
          {
            followerId: followerId,
            targetId: company.ProfileId?._id, // Use company's profile ID instead of company ID
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (response.data.status === 'success') {
          setFollowStatus({
            isFollowing: response.data.isFollowing || false,
            followersCount:
              response.data.targetProfile?.followersCount ||
              company.ProfileId?.followers?.length ||
              0,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking relationship status:', error);
        setFollowStatus({
          isFollowing: false,
          followersCount: company.ProfileId?.followers?.length || 0,
          isLoading: false,
        });
      }
    };

    checkRelationshipStatus();
  }, [company, user, activeProfile, accessToken, isAuthenticated]);

  const handleFollowChange = (newStatus: FollowStatus) => {
    setFollowStatus(newStatus);

    // Update the local company object with the new followers count
    if (company?.ProfileId) {
      const updatedCompany = {
        ...company,
        ProfileId: {
          ...company.ProfileId,
          followers: Array(newStatus.followersCount).fill(null),
        },
      };
      setCompany(updatedCompany);
    }
  };

  useEffect(() => {
    if (!companyIdentifier) {
      navigate('/404', { replace: true });
    }
  }, [companyIdentifier, navigate]);

  // Separate useEffect for fetching company data - only runs when needed
  useEffect(() => {
    // Only fetch if we should fetch (memoized condition)
    if (shouldFetch) {
      const fetchCompanyDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/startup/slug/${companyIdentifier}?includeAnalytics=true`,
          );
          setCompany(response.data.company);
        } catch (error) {
          const errorObj = error as { response?: { data?: { message?: string } } };
          setError(
            'Failed to load startup details' +
              (errorObj.response?.data?.message ? `: ${errorObj.response.data.message}` : ''),
          );
        } finally {
          setLoading(false);
        }
      };
      fetchCompanyDetails();
    }
  }, [shouldFetch, companyIdentifier]); // Use memoized shouldFetch

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-lg font-medium text-gray-600"
        >
          Loading startup details...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-gray-50"
      >
        <div className="flex items-center justify-center w-16 h-16 mb-4 text-red-500 bg-red-100 rounded-full">
          <FaArrowLeft size={32} />
        </div>
        <p className="mb-4 text-lg font-medium text-gray-800">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Go Back
        </button>
      </motion.div>
    );
  }

  if (!company) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-gray-50"
      >
        <p className="mb-4 text-gray-600">Startup not found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 text-white transition-colors bg-blue-500 rounded-md hover:bg-blue-600"
        >
          Go Back
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-dvw bg-transparent px-2 sm:px-4 lg:px-0"
    >
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col space-y-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 transition-colors hover:text-gray-900 group"
            >
              <FaArrowLeft className="mr-2 transition-transform group-hover:-translate-x-1" />
              Back
            </button>
            <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
              <VerificationBadge verified={company.verified} status={company.verificationStatus} />
              <FollowStatusIndicator
                isFollowing={followStatus.isFollowing}
                companyName={company.name}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm text-gray-500"
              >
                {company.type === 'startup' && (
                  <span className="px-3 py-1 text-xs font-medium text-white rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                    STARTUP
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="overflow-hidden bg-white shadow-lg rounded-xl">
            <div className="relative h-64 overflow-hidden bg-[rgba(0,0,0,0.7)]">
              <img
                src={company.banner}
                alt="Company Banner"
                className="absolute inset-0 object-cover w-full h-full mix-blend-overlay"
              />

              <div className="absolute flex flex-col gap-2 sm:gap-3 top-2 right-2 sm:top-4 sm:right-4">
                <motion.div
                  className="flex items-center px-2 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1 mr-2 sm:p-2 sm:mr-3 bg-green-100 rounded-full">
                    <FiTrendingUp className="text-green-600 text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Stage</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">{company.stage}</p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center px-2 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1 mr-2 sm:p-2 sm:mr-3 bg-blue-100 rounded-full">
                    <FiUsers className="text-blue-600 text-sm sm:text-base" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Team</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900">
                      {company.companySize}
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center px-2 py-2 sm:px-4 sm:py-3 rounded-lg shadow-lg bg-white/90 backdrop-blur-sm"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="p-1 mr-2 sm:p-2 sm:mr-3 bg-purple-100 rounded-full">
                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Industry</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{company.industry}</p>
                  </div>
                </motion.div>
              </div>

              <div className="absolute text-white bottom-4 left-8">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm font-medium opacity-90"
                >
                  Founded in {company.establishedYear}
                </motion.p>
              </div>
            </div>

            <div className="relative px-6 pt-16 pb-8 md:px-8">
              <div className="absolute -top-16 left-8">
                <motion.div
                  initial={{ y: 20, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative w-32 h-32 overflow-hidden bg-white border-4 border-white shadow-2xl rounded-2xl group"
                  whileHover={{ scale: 1.05 }}
                >
                  <img
                    src={company.logo || '/default-logo.png'}
                    alt={company.name}
                    className="object-contain w-full h-full p-2"
                  />
                  <div className="absolute inset-0 transition-opacity opacity-0 bg-gradient-to-t from-black/10 to-transparent group-hover:opacity-100" />
                </motion.div>
              </div>

              <div className="flex flex-col justify-between md:flex-row">
                <div className="flex-1 md:ml-40">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center mb-2 space-x-3"
                  >
                    <h1 className="text-4xl font-bold text-gray-900">{company.name}</h1>
                    {company.verified && <HiOutlineBadgeCheck className="text-2xl text-blue-500" />}
                  </motion.div>

                  <motion.p
                    className="mb-3 text-xl font-semibold text-blue-600"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {company.tagline}
                  </motion.p>

                  <motion.div
                    className="flex flex-wrap gap-6 text-sm text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center px-3 py-1 rounded-full bg-gray-50">
                      <BsBuilding className="mr-2 text-blue-500" />
                      <span className="font-medium">{company.industry}</span>
                    </div>

                    <div className="flex items-center px-3 py-1 rounded-full bg-gray-50">
                      <FiMapPin className="mr-2 text-green-500" />
                      <span className="font-medium">
                        {company.city}, {company.state}
                      </span>
                    </div>

                    <div className="flex items-center px-3 py-1 rounded-full bg-gray-50">
                      <FaCalendarAlt className="mr-2 text-purple-500" />
                      <span className="font-medium">Est. {company.establishedYear}</span>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  className="mt-6 md:mt-0"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <AdvancedFollowButton
                    companyName={company.name}
                    followStatus={followStatus}
                    companyProfile={company.ProfileId?._id || ''}
                    onFollowChange={handleFollowChange}
                    size="large"
                  />
                </motion.div>
              </div>

              {/* navigation tabs */}
              <div className="mt-8 mb-8 border-b border-gray-200">
                <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
                  {[
                    { key: 'overview', label: 'Overview', icon: Building2 },
                    { key: 'metrics', label: 'Metrics', icon: FaChartLine },
                    { key: 'team', label: 'Team', icon: Users },
                    { key: 'jobs', label: 'Jobs', icon: Briefcase },
                    { key: 'contact', label: 'Contact', icon: Globe },
                  ].map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        className={`flex items-center space-x-2 pb-4 px-2 font-medium transition-all relative ${
                          activeTab === tab.key
                            ? 'text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => updateTabInUrl(tab.key)}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {activeTab === tab.key && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                          />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="overflow-y-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.3 }}
                      className="space-y-10"
                    >
                      {/* Company Description */}
                      <motion.section variants={itemVariants} className="max-w-4xl">
                        <h2 className="flex items-center mb-4 text-2xl font-bold text-gray-800">
                          <MdBusiness className="mr-3 text-blue-500" />
                          About {company.name}
                          <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                        </h2>
                        <div className="p-8 border border-blue-100 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                          <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-line">
                            {company.description}
                          </p>
                        </div>
                      </motion.section>

                      {/*  Company Stats */}
                      <motion.section variants={itemVariants}>
                        <h2 className="flex items-center mb-6 text-2xl font-bold text-gray-800">
                          <FaChartLine className="mr-3 text-green-500" />
                          Company Statistics
                          <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
                        </h2>
                        <CompanyStatsGrid company={company} />
                      </motion.section>

                      {company.ProfileId && (
                        <motion.section variants={itemVariants}>
                          <h2 className="flex items-center mb-6 text-2xl font-bold text-gray-800">
                            <FaUserFriends className="mr-3 text-purple-500" />
                            Company Profile
                            <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                          </h2>
                          <div className="p-4 sm:p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
                            <div className="flex flex-col space-y-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 overflow-hidden bg-gray-100 rounded-xl mx-auto sm:mx-0 flex-shrink-0">
                                  <img
                                    src={company.ProfileId.image || company.logo}
                                    alt="Profile"
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                                <div className="flex-1 text-center sm:text-left min-w-0">
                                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                                    @{company.ProfileId.username}
                                  </h3>
                                  <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                                    {company.ProfileId.bio}
                                  </p>
                                </div>
                              </div>

                              <div className="flex justify-center sm:justify-end flex-shrink-0">
                                <AdvancedFollowButton
                                  companyProfile={company.ProfileId?._id || ''}
                                  companyName={company.name}
                                  followStatus={followStatus}
                                  onFollowChange={handleFollowChange}
                                  size="medium"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                              <motion.div
                                className="p-3 sm:p-4 text-center rounded-lg bg-blue-50"
                                whileHover={{ scale: 1.05, y: -2 }}
                                transition={{ duration: 0.2 }}
                              >
                                <motion.p
                                  className="text-xl sm:text-2xl font-bold text-blue-600"
                                  key={followStatus.followersCount}
                                  initial={{ scale: 1.2, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {followStatus.followersCount}
                                </motion.p>
                                <p className="text-xs sm:text-sm text-gray-600">Followers</p>
                              </motion.div>
                              <motion.div
                                className="p-3 sm:p-4 text-center rounded-lg bg-green-50"
                                whileHover={{ scale: 1.05, y: -2 }}
                                transition={{ duration: 0.2 }}
                              >
                                <p className="text-xl sm:text-2xl font-bold text-green-600">
                                  {company.ProfileId.following?.length || 0}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">Following</p>
                              </motion.div>
                              <motion.div
                                className="p-3 sm:p-4 text-center rounded-lg bg-purple-50"
                                whileHover={{ scale: 1.05, y: -2 }}
                                transition={{ duration: 0.2 }}
                              >
                                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                                  {company.ProfileId.posts?.length || 0}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">Posts</p>
                              </motion.div>
                            </div>
                          </div>
                        </motion.section>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'metrics' && (
                    <motion.div
                      key="metrics"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                      <CompanyMetricsDashboard />
                    </motion.div>
                  )}

                  {activeTab === 'team' && (
                    <motion.div
                      key="team"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.3 }}
                      className="space-y-10"
                    >
                      <motion.section variants={itemVariants}>
                        <h2 className="flex items-center mb-6 text-2xl font-bold text-gray-800">
                          <FaBullhorn className="mr-3 text-yellow-500" />
                          Leadership Team
                          <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                        </h2>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                          <TeamMemberCard
                            member={{
                              userId: company.superAdmin,
                              role: 'founder',
                            }}
                            isFounder={true}
                          />
                        </div>
                      </motion.section>

                      {company.teamMembers && company.teamMembers.length > 0 && (
                        <motion.section variants={itemVariants}>
                          <h2 className="flex items-center mb-6 text-2xl font-bold text-gray-800">
                            <Users className="w-6 h-6 mr-3 text-blue-500" />
                            Team Members ({company.teamMembers.length})
                            <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                          </h2>

                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {company.teamMembers.map((member, index) => (
                              <TeamMemberCard key={member._id || index} member={member} />
                            ))}
                          </div>
                        </motion.section>
                      )}

                      <motion.section variants={itemVariants}>
                        <h2 className="flex items-center mb-6 text-2xl font-bold text-gray-800">
                          <FaUserFriends className="mr-3 text-green-500" />
                          Company Culture
                          <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500"></div>
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              title: 'Collaborative Environment',
                              description:
                                'Fostering teamwork and collective innovation across all departments.',
                              icon: FaUserFriends,
                              color: 'blue',
                            },
                            {
                              title: 'Growth Mindset',
                              description:
                                'Continuously evolving and adapting to new challenges and opportunities.',
                              icon: FiTrendingUp,
                              color: 'green',
                            },
                            {
                              title: 'Innovation Driven',
                              description:
                                'Pushing boundaries and exploring cutting-edge solutions.',
                              icon: FaChartLine,
                              color: 'purple',
                            },
                          ].map((culture, index) => {
                            const IconComponent = culture.icon;
                            const colorClasses = {
                              blue: 'from-blue-50 to-blue-100 text-blue-700 bg-blue-200',
                              green: 'from-green-50 to-green-100 text-green-700 bg-green-200',
                              purple: 'from-purple-50 to-purple-100 text-purple-700 bg-purple-200',
                            };

                            return (
                              <motion.div
                                key={index}
                                whileHover={{ y: -5, scale: 1.02 }}
                                className={`bg-gradient-to-br ${colorClasses[culture.color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')} p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all`}
                              >
                                <div
                                  className={`${colorClasses[culture.color as keyof typeof colorClasses].split(' ').slice(2).join(' ')} p-3 md:p-4 rounded-2xl w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mb-4 md:mb-6`}
                                >
                                  <IconComponent
                                    className={`${colorClasses[culture.color as keyof typeof colorClasses].split(' ')[2]} text-xl md:text-2xl`}
                                  />
                                </div>
                                <h3 className="mb-2 md:mb-3 text-base md:text-lg font-bold text-gray-800">
                                  {culture.title}
                                </h3>
                                <p className="text-sm md:text-base leading-relaxed text-gray-600">
                                  {culture.description}
                                </p>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.section>
                    </motion.div>
                  )}

                  {activeTab === 'jobs' && (
                    <motion.div
                      key="jobs"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <motion.section variants={itemVariants}>
                        <div className="mb-6">
                          <h2 className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 text-2xl font-bold text-gray-800">
                            <div className="flex items-center">
                              <Briefcase className="w-6 h-6 mr-3 text-blue-500" />
                              Open Positions
                              <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                            </div>
                            {company.jobs && (
                              <span className="px-3 py-1 sm:ml-4 text-sm font-medium text-blue-800 bg-blue-100 rounded-full self-start sm:self-auto">
                                {company.jobs.length}{' '}
                                {company.jobs.length === 1 ? 'Position' : 'Positions'}
                              </span>
                            )}
                          </h2>
                        </div>

                        {company.jobs && company.jobs.length > 0 ? (
                          <div className="grid gap-6">
                            {company.jobs.map((job) => (
                              <motion.div
                                key={job._id}
                                variants={itemVariants}
                                whileHover={{ scale: 1.01 }}
                                className="p-8 transition-all bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-200"
                              >
                                <div className="flex flex-col items-start justify-between space-y-4 lg:flex-row lg:items-center lg:space-y-0">
                                  <div className="flex-1">
                                    <div className="flex items-center mb-3 space-x-3">
                                      <h3 className="text-2xl font-bold text-gray-800">
                                        {job.title}
                                      </h3>
                                      <span className="px-3 py-1 text-sm font-medium text-white rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                                        {job.type}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap gap-6 mb-4 text-gray-600">
                                      <div className="flex items-center px-3 py-1 rounded-lg bg-gray-50">
                                        <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                        <span className="font-medium">{job.location}</span>
                                      </div>
                                      <div className="flex items-center px-3 py-1 rounded-lg bg-gray-50">
                                        <FiDollarSign className="w-4 h-4 mr-2 text-green-500" />
                                        <span className="font-bold text-green-600">
                                          {job.salary}
                                        </span>
                                      </div>
                                    </div>

                                    {job.description && (
                                      <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
                                        {job.description}
                                      </p>
                                    )}
                                  </div>

                                  <motion.button
                                    onClick={() => navigate(`/dashboard/jobs/${job._id}`)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center px-8 py-3 font-semibold text-white transition-all bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg"
                                  >
                                    Apply Now
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <motion.div
                            variants={itemVariants}
                            className="p-12 text-center border-2 border-gray-300 border-dashed bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl"
                          >
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
                                <Briefcase className="text-3xl text-blue-500" />
                              </div>
                              <h3 className="mb-4 text-2xl font-bold text-gray-800">
                                No Open Positions
                              </h3>
                              <p className="max-w-md mb-6 text-lg leading-relaxed text-gray-600">
                                This startup doesn't have any open positions at the moment. Check
                                back later or follow them for updates on new opportunities.
                              </p>
                              <div className="mt-6">
                                <AdvancedFollowButton
                                  companyName={company.name}
                                  companyProfile={company.ProfileId?._id || ''}
                                  followStatus={followStatus}
                                  onFollowChange={handleFollowChange}
                                  size="medium"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.section>
                    </motion.div>
                  )}

                  {activeTab === 'contact' && (
                    <motion.div
                      key="contact"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ duration: 0.3 }}
                      className="space-y-10"
                    >
                      <motion.section variants={itemVariants}>
                        <h2 className="flex items-center mb-6 text-2xl font-bold text-gray-800">
                          <Globe className="w-6 h-6 mr-3 text-blue-500" />
                          Get in Touch
                          <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        </h2>

                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                          <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-xl">
                            <h3 className="mb-6 text-xl font-bold text-gray-800">
                              Contact Information
                            </h3>

                            <div className="space-y-6">
                              {[
                                {
                                  icon: FaGlobe,
                                  label: 'Website',
                                  value: company.website,
                                  href: company.website?.startsWith('http')
                                    ? company.website
                                    : `https://${company.website}`,
                                  color: 'blue',
                                },
                                {
                                  icon: FaEnvelope,
                                  label: 'Email',
                                  value: company.email,
                                  href: `mailto:${company.email}`,
                                  color: 'green',
                                },
                                {
                                  icon: FaPhone,
                                  label: 'Phone',
                                  value: company.phone,
                                  href: `tel:${company.phone}`,
                                  color: 'purple',
                                },
                              ].map((contact, index) => {
                                if (!contact.value) return null;

                                const IconComponent = contact.icon;
                                const colorClasses = {
                                  blue: 'bg-blue-100 text-blue-600',
                                  green: 'bg-green-100 text-green-600',
                                  purple: 'bg-purple-100 text-purple-600',
                                };

                                return (
                                  <motion.div
                                    key={index}
                                    whileHover={{ x: 5 }}
                                    className="flex items-center p-0 space-x-4 transition-all rounded-xl hover:bg-gray-50"
                                  >
                                    <div
                                      className={`p-3 rounded-xl ${colorClasses[contact.color as keyof typeof colorClasses]}`}
                                    >
                                      <IconComponent className="text-xl" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium tracking-wide text-gray-500 uppercase">
                                        {contact.label}
                                      </p>
                                      <a
                                        href={contact.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-base sm:text-lg font-semibold text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                                      >
                                        {contact.value?.replace(/^https?:\/\/(www\.)?/, '')}
                                      </a>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-xl">
                            <h3 className="mb-6 text-xl font-bold text-gray-800">Social Media</h3>

                            {company.socialLinks && company.socialLinks.length > 0 ? (
                              <SocialMediaGrid socialLinks={company.socialLinks} />
                            ) : (
                              <div className="py-8 text-center">
                                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                                  <FaGlobe className="text-2xl text-gray-400" />
                                </div>
                                <p className="text-gray-500">No social media links available.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.section>

                      <motion.section variants={itemVariants}>
                        <h2 className="flex items-center mb-6 text-2xl font-bold text-gray-800">
                          <FiMapPin className="mr-3 text-green-500" />
                          Location & Headquarters
                          <div className="w-12 h-1 ml-3 rounded-full bg-gradient-to-r from-green-500 to-teal-500"></div>
                        </h2>

                        <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-xl">
                          <div className="grid items-center grid-cols-1 gap-8 lg:grid-cols-2">
                            <div>
                              <div className="flex items-center mb-6">
                                <div className="p-3 mr-4 bg-green-100 rounded-xl">
                                  <MdLocationCity className="text-2xl text-green-600" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-800">Headquarters</h3>
                                  <p className="text-gray-600">Primary business location</p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
                                  <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">City</p>
                                      <p className="text-lg font-bold text-gray-800">
                                        {company.city}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">State</p>
                                      <p className="text-lg font-bold text-gray-800">
                                        {company.state}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-500">Country</p>
                                      <p className="text-lg font-bold text-gray-800">
                                        {company.country}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-center h-64 border-2 border-gray-300 border-dashed bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
                              <div className="text-center">
                                <MdLocationCity className="mx-auto mb-4 text-6xl text-gray-400" />
                                <p className="font-medium text-gray-500">Interactive Map</p>
                                <p className="text-sm text-gray-400">Coming Soon</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.section>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StartupDetails;

import { useState, useEffect } from 'react';
import { CalendarIcon, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Company } from '../../types/company';

interface SidebarCardProps {
  company: Company;
}

const SidebarCard: React.FC<SidebarCardProps> = ({ company }) => {
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use company slug from ProfileId.username if available, otherwise fallback to company.slug
    const slug = company.ProfileId?.username || company.slug || company._id;
    navigate(`/company/${slug}`, { state: { company } });
  };

  const truncatedDescription =
    company.description.length > 120
      ? `${company.description.substring(0, 120)}...`
      : company.description;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="group bg-white rounded-xl p-6 transition-all duration-300"
        style={{
          boxShadow: isHovered ? '0 8px 30px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <SkeletonContent />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100 p-0.5">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.src = '/logo.png';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                      {company.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-2.5 py-1 rounded-full">
                        <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                        <span>{company.establishedYear}</span>
                      </div>
                      {/* <div className="flex items-center text-amber-500 text-sm">
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">{truncatedDescription}</p>

              {company.fundedType && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800 text-xs font-medium uppercase tracking-wide">
                      Current Stage
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-blue-700 font-medium">{company.fundedType}</span>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 mt-4"></div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-0.5">
                    <img
                      src={company.superAdmin?.photo || '/logo_circle.png'}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = '/logo_circle.png';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm font-medium">
                      {company.superAdmin?.firstName} {company.superAdmin?.lastName}
                    </p>
                    <p className="text-gray-500 text-xs">Founder & CEO</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-blue-600 text-sm cursor-pointer font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors hover:bg-blue-50 border border-transparent hover:border-blue-100"
                  onClick={(e) =>
                    isAuthenticated()
                      ? handleViewDetails(e)
                      : (window.location.href = '/auth/signin')
                  }
                >
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const SkeletonContent = () => (
  <div className="space-y-5">
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>

    <Skeleton className="h-20 w-full rounded-xl" />

    <div className="pt-4 mt-4 border-t border-gray-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  </div>
);

export default SidebarCard;

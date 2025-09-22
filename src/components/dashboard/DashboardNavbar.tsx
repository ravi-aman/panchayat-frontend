import React, { useEffect, useState, useRef } from 'react';
import { useUnreadMessage } from '../../contexts/UnreadMessageContext';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Profile } from '../../types/types';
import { useToast } from '../../contexts/toast/toastContext';

const DashboardNavbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { logout, isAuthenticated, user, activeProfile, UpdateActiveProfile } = useAuth();

  const { totalUnreadCount } = useUnreadMessage();
  const toast = useToast();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get all profiles except the active one
  const otherProfiles = (user?.profileIds || []).filter(
    (profile): profile is Profile =>
      typeof profile === 'object' &&
      profile !== null &&
      'username' in profile &&
      (profile as Profile)._id !== activeProfile?._id,
  );
  console.log(activeProfile);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-white shadow-md">
      <div className="flex items-center space-x-4">
        <div className="flex items-center pr-36">
          <img
            src="/logo.png"
            alt="Neecop Logo"
            className="h-8 cursor-pointer"
            onClick={() => (window.location.href = '/')}
          />
        </div>
        <div className="relative flex items-center px-3 py-1 rounded-md">
          <img src="/dashboard/search.png" alt="Search" className="h-[22px] w-[22px]" />
          <input
            type="text"
            placeholder="Search..."
            className="ml-2 text-gray-700 border-none outline-none bg-none"
          />
        </div>
      </div>
      <div className="flex items-center space-x-5">
        <div
          className="relative cursor-pointer"
          onClick={() => (window.location.href = '/dashboard/chat')}
        >
          <img src="/dashboard/message.png" alt="Messages" className="w-6 h-6 cursor-pointer" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {totalUnreadCount}
            </span>
          )}
        </div>
        {/* <div className="relative cursor-pointer">
          <img src="/dashboard/bell.png" alt="Notifications" className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            5
          </span>
        </div> */}
        <div className="relative" ref={dropdownRef}>
          {isAuthenticated() ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-2"
              >
                <img
                  src={activeProfile?.image || `${import.meta.env.VITE_DEFAULT_PICTURE}`}
                  alt="User Avatar"
                  className="object-cover rounded-full h-9 w-9"
                />
                <span className="flex items-center gap-2 font-medium">
                  {activeProfile?.username || 'Account'}
                  <img
                    src="/dashboard/downArrow.png"
                    className="w-5 h-5 transition-transform duration-200"
                    style={{
                      transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                    alt=""
                  />
                </span>
              </button>
            </div>
          ) : (
            <div className="flex  items-center gap-2 p-2">
              <a
                href="/auth/signin"
                className="bg-blue-700 py-1 px-6 rounded-[8px] text-white hover:bg-blue-600 transition duration-300 font-bold"
              >
                Login
              </a>
              <a
                href="/auth/signup"
                className="border-2 border-blue-700 py-1 px-6 rounded-[8px] text-blue-700 hover:bg-blue-600 hover:text-white transition duration-300 font-bold"
              >
                Register
              </a>
            </div>
          )}

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 w-56 mt-4 overflow-hidden bg-white border rounded-lg shadow-lg"
              >
                {/* Active Profile */}
                <a
                  href={
                    activeProfile?.type === 'user'
                      ? `/user/${activeProfile?.username}`
                      : `/company/${activeProfile?.username}`
                  }
                >
                  <div className="p-3 border-b bg-gray-50">
                    <p className="mb-1 text-xs font-medium text-gray-500">ACTIVE NOW</p>
                    <div className="flex items-center gap-3 p-2 transition-colors rounded-lg hover:bg-blue-100">
                      <img
                        src={activeProfile?.image || `${import.meta.env.VITE_DEFAULT_PICTURE}`}
                        alt="Active profile"
                        className="object-cover w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium">{activeProfile?.username}</p>
                        <p className="text-xs text-gray-500">
                          {activeProfile?.type === 'user' ? 'Personal Account' : 'Startup Account'}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>

                {/* Other Profiles */}
                {otherProfiles.length > 0 && (
                  <div className="p-3">
                    <p className="mb-1 text-xs font-medium text-gray-500">SWITCH TO</p>
                    <div className="space-y-2">
                      {otherProfiles.map((profile) => (
                        <button
                          key={profile._id}
                          onClick={() => {
                            UpdateActiveProfile?.(profile);
                            setIsDropdownOpen(false);
                          }}
                          className="flex items-center w-full gap-3 p-2 transition-colors rounded-lg hover:bg-gray-100"
                        >
                          <img
                            src={profile.image || `${import.meta.env.VITE_DEFAULT_PICTURE}`}
                            alt={profile.username}
                            className="object-cover w-8 h-8 rounded-full"
                          />
                          <div className="text-left">
                            <p className="text-sm font-medium">{profile.username}</p>
                            <p className="text-xs text-gray-500">
                              {profile.type === 'user' ? 'Personal Account' : 'Startup Account'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Logout Button */}
                <div className="p-3 border-t">
                  {isAuthenticated() && (
                    <div className="flex justify-center">
                      <motion.button
                        onClick={() => {
                          logout();
                          toast.open({
                            message: {
                              heading: 'Logout Successful',
                              content: 'You have successfully logged out.',
                            },
                            duration: 5000,
                            position: 'top-center',
                            color: 'warning',
                          });
                          setIsDropdownOpen(false);
                        }}
                        className="border-2 cursor-pointer border-blue-700 py-1.5 px-6 rounded-lg text-blue-700 hover:bg-blue-600 hover:text-white transition duration-300 font-bold w-full"
                        whileHover={{ scale: 1.02 }}
                      >
                        Logout
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;

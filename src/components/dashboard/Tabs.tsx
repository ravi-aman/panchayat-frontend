import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/toast/toastContext';
import { Profile } from '../../types/types';

const tabs = [
  { href: '/dashboard/funds', icon: '/dashboard/dashboard.png', label: 'Funds' },
  { href: '/dashboard/reports', icon: '/dashboard/funds.png', label: 'Reports' },
  { href: '/startup/register', icon: '/dashboard/plus.png', label: 'Create', special: true },
  { href: '/dashboard/heatmap', icon: '/dashboard/dashboard.png', label: 'Heatmap' },
  { href: '/dashboard/startups', icon: '/dashboard/knowledge.png', label: 'Startups' },
];

export default function Tabs() {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const location = useLocation();

  const { logout, isAuthenticated, user, activeProfile, UpdateActiveProfile } = useAuth();
  const toast = useToast();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show/Hide tabs on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 5);
      setPrevScrollPos(currentScrollPos);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  // Other profiles list
  const otherProfiles = (user?.profileIds || []).filter(
    (profile): profile is Profile =>
      typeof profile === 'object' &&
      profile !== null &&
      'username' in profile &&
      (profile as Profile)._id !== activeProfile?._id,
  );

  return (
    <motion.div
      className="fixed bottom-0 w-full bg-white shadow-xl"
      style={{ zIndex: 9998 }}
      initial={{ y: 100 }}
      animate={{ y: visible ? 0 : 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="container px-4 py-2 flex justify-between items-center">
        {tabs.map((tab, index) => {
          const isActive = location.pathname.startsWith(tab.href);
          return (
            <motion.a
              key={index}
              href={tab.href}
              className="flex flex-col items-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.img
                src={tab.icon}
                className={`w-7 ${tab.special ? 'bg-gray-600 p-1 rounded-full' : ''}`}
                alt={tab.label}
                animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 150 }}
              />
              <span className={`text-xs ${isActive ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </motion.a>
          );
        })}

        {/* Profile Tab */}
        <div className="relative" ref={dropdownRef}>
          <motion.button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex flex-col items-center focus:outline-none"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={activeProfile?.image || `${import.meta.env.VITE_DEFAULT_PICTURE}`}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-blue-500"
            />
            <span className="text-xs font-medium">Profile</span>
          </motion.button>
          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -10 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full mb-3 right-0 w-64 bg-white shadow-xl rounded-lg border overflow-hidden"
                style={{ zIndex: 9999 }}
              >
                {isAuthenticated() ? (
                  <>
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
                        <div className="flex items-center gap-3 p-2 hover:bg-blue-50 rounded-lg">
                          <img
                            src={activeProfile?.image || `${import.meta.env.VITE_DEFAULT_PICTURE}`}
                            className="w-10 h-10 rounded-full object-cover"
                            alt="Active"
                          />
                          <div>
                            <p className="text-sm font-medium">{activeProfile?.username}</p>
                            <p className="text-xs text-gray-500">
                              {activeProfile?.type === 'user'
                                ? 'Personal Account'
                                : 'Startup Account'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </a>

                    {/* Other Profiles */}
                    {otherProfiles.length > 0 && (
                      <div className="p-3">
                        <p className="mb-1 text-xs font-medium text-gray-500">SWITCH TO</p>
                        {otherProfiles.map((profile) => (
                          <button
                            key={profile._id}
                            onClick={() => {
                              UpdateActiveProfile?.(profile);
                              setIsDropdownOpen(false);
                            }}
                            className="flex items-center w-full gap-3 p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <img
                              src={profile.image || `${import.meta.env.VITE_DEFAULT_PICTURE}`}
                              className="w-8 h-8 rounded-full object-cover"
                              alt={profile.username}
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
                    )}

                    {/* Logout */}
                    <div className="p-3 border-t">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
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
                        className="w-full py-2 px-4 text-sm font-bold text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
                      >
                        Logout
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 flex flex-col gap-2">
                    <a
                      href="/auth/signin"
                      className="w-full text-sm px-3 py-1 rounded bg-blue-500 text-white font-medium text-center"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Login
                    </a>
                    <a
                      href="/auth/signup"
                      className="w-full text-sm px-3 py-1 rounded bg-gray-200 text-blue-600 font-medium text-center"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Register
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

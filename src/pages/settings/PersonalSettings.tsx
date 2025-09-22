'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import ProfileTab from '../../components/settings/ProfileTab';
import NotificationTab from '../../components/settings/NotificationsTab';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types/types';

// const tabs = ["Profile", "Notifications", "Account", "Security"];
const tabs = ['Profile'];

export default function PersonalSettings() {
  const [activeTab, setActiveTab] = useState('Profile');
  const { user } = useAuth();

  return (
    <motion.div className="w-full min-h-screen px-8 py-10 bg-gray-50">
      <div className="w-full p-8 mx-auto bg-white shadow-md rounded-xl">
        <h2 className="mb-6 text-2xl font-semibold text-gray-800">Settings</h2>
        {/* Top Tabs */}
        <div className="flex gap-6 mb-8 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'pb-2 text-sm font-medium',
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-blue-500',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Animated Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'Profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ProfileTab user={user as User} />
            </motion.div>
          )}
          {activeTab === 'Notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NotificationTab />
            </motion.div>
          )}
          {activeTab === 'Account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-500">Account settings content goes here.</p>
            </motion.div>
          )}
          {activeTab === 'Security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-500">Security settings content goes here.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

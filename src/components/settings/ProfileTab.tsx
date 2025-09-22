import { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types/types';
import { useToast } from '../../contexts/toast/toastContext';
import api from '../../utils/api';

interface ProfileTabProps {
  user: User;
}
export default function ProfileTab({ user }: ProfileTabProps) {
  const [curr, setCurr] = useState<User>(user);
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('GMT +02:00');
  const toast = useToast();
  const handleUpdateProfile = async () => {
    try {
      console.log('Profile updated:', { curr });
      await api.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/edit/${user._id}`, curr);
      toast.open({
        message: {
          heading: 'Profile Updated',
          content: 'Your profile has been updated successfully.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'success',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.open({
        message: {
          heading: 'Profile Update Failed',
          content: 'There was an error updating your profile. Please try again.',
        },
        duration: 5000,
        position: 'top-center',
        color: 'error',
      });
    }
  };

  return (
    <>
      {/* Section 1: Profile Image */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Profile Details</h3>
        <p className="text-sm text-gray-500 mb-4">Enter your profile information</p>
        <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center">
          <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
            Add File
          </button>
          <p className="text-xs text-gray-400 mt-2">Or drag and drop files</p>
        </div>
      </section>

      {/* Section 2: Personal Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            type="text"
            value={curr.firstName || ''}
            onChange={(e) => setCurr((prev) => ({ ...prev, firstName: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            type="text"
            value={curr.lastName || ''}
            onChange={(e) => setCurr((prev) => ({ ...prev, lastName: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            value={curr.email || ''}
            onChange={(e) => setCurr((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="text"
            value={curr.phone || ''}
            onChange={(e) => setCurr((prev) => ({ ...prev, phone: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
        </div>
      </section>

      {/* Section 3: Regional Settings */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Regional Settings</h3>
        <p className="text-sm text-gray-500 mb-4">Set your language and timezone</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option>GMT +02:00</option>
              <option>GMT +05:30</option>
              <option>GMT +00:00</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section 4: Save/Cancel */}
      <motion.div
        className="flex justify-end gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100">
          Cancel
        </button>
        <button
          className="px-5 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          onClick={() => handleUpdateProfile()}
        >
          Save
        </button>
      </motion.div>
    </>
  );
}

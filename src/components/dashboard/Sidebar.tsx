import React from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUnreadMessage } from '../../contexts/UnreadMessageContext';

const menuItems = [
  { name: 'Dashboard', icon: '/dashboard/dashboard.png', href: '/dashboard/feed' },
  { name: 'Funds', icon: '/dashboard/funds.png', href: '/dashboard/funds' },
  { name: 'Startups', icon: '/dashboard/startup.png', href: '/dashboard/startups' },
  { name: "MSME's", icon: '/dashboard/msme.png', href: '/dashboard/msme' },
  {
    name: 'Government Policy',
    icon: '/dashboard/policy.png',
    href: '/dashboard/government_policies',
  },
  { name: 'Reports', icon: '/dashboard/reports.png', href: '/dashboard/reports' },
  { name: 'Heatmap', icon: '/dashboard/dashboard.png', href: '/dashboard/heatmap' },
  { name: 'Connections', icon: '/dashboard/connection.png', href: '/dashboard/connections' },
  { name: 'Chat', icon: '/dashboard/inbox.png', href: '/dashboard/chat' },
];

const otherInfo = [
  { name: 'Knowledge Base', icon: '/dashboard/knowledge.png', href: '/dashboard/knowledge_base' },
  // { name: "Funding Updates", icon: "/dashboard/update.png", href: "/dashboard/funding_updates" },
];

const settings = [
  { name: 'Personal Settings', icon: '/dashboard/personal.png', href: '/dashboard/personal' },
  // { name: "Global Settings", icon: "/dashboard/setting.png", href: "/settings/global" },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { totalUnreadCount } = useUnreadMessage();

  return (
    <aside className="fixed top-16 w-60 h-[calc(100vh-65px)] flex flex-col shadow-lg bg-white z-5 pt-5 ">
      <div className="flex-1 px-4 pt-2 pb-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 scrollbar-hide">
        <nav>
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 my-1 cursor-pointer rounded-md transition-all duration-200 ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.1 }}
                className="flex items-center w-full"
              >
                <img src={item.icon} alt={item.name} className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
                {item.name === 'Chat' && totalUnreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalUnreadCount}
                  </span>
                )}
              </motion.div>
            </NavLink>
          ))}

          <h3 className="mt-4 text-sm text-gray-400">Other Information</h3>
          {otherInfo.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 my-1 cursor-pointer rounded-md transition-all duration-200 ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.1 }}
                className="flex items-center w-full"
              >
                <img src={item.icon} alt={item.name} className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </motion.div>
            </NavLink>
          ))}

          <h3 className="mt-4 text-sm text-gray-400">Settings</h3>
          {settings.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 my-1 cursor-pointer rounded-md transition-all duration-200 ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.1 }}
                className="flex items-center w-full"
              >
                <img src={item.icon} alt={item.name} className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </motion.div>
            </NavLink>
          ))}
        </nav>
      </div>

      <motion.div
        className="relative p-4 m-3 overflow-hidden text-white bg-blue-600 rounded-lg shadow-lg cursor-pointer"
        onClick={() => navigate('/dashboard/grow-business')}
      >
        <div className="absolute inset-0 bg-[url('/dashboard/cover.png')] bg-right bg-no-repeat bg-[length:60px] opacity-80" />
        <div className="relative z-10">
          <h4 className="font-bold">Grow Business</h4>
          <p className="mt-1 text-xs">Explore our marketing solutions</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 mt-5 text-sm text-blue-600 rounded-md cursor-pointer bg-blue-50"
          >
            Read More
          </motion.button>
        </div>
      </motion.div>
    </aside>
  );
};

export default Sidebar;

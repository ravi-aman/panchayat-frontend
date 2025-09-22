// import React from 'react';
import { motion } from 'framer-motion';
import commigSoon from '../../../../assets/coming_soon.mp4';

const FundingUpdates = () => {
  return (
    <div>
      <video src={commigSoon} autoPlay loop muted className="h-screen" />
    </div>
  );
  // Mock data for the chart
  // const chartData = {
  //     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  //     values: [30, 45, 35, 60, 75, 65, 85, 95, 75, 65, 85, 95]
  // };

  // Mock data for recent activities
  const recentActivities = [
    { id: 1, name: 'Leroy Wise', time: '2hr ago', amount: '$22,969' },
    { id: 2, name: 'Sean Hill', time: '2.5hr ago', amount: '$20,540' },
    { id: 3, name: 'Lottie Gray', time: '3hr ago', amount: '$19,435' },
    { id: 4, name: 'Sadie Ramsey', time: '3hr ago', amount: '$16,480' },
    { id: 5, name: 'Floyd Pearson', time: '3hr ago', amount: '$12,355' },
    { id: 6, name: 'Leroy Wise', time: '2hr ago', amount: '$22,969' },
    { id: 7, name: 'Sean Hill', time: '2.5hr ago', amount: '$20,540' },
    { id: 8, name: 'Lottie Gray', time: '3hr ago', amount: '$19,435' },
  ];

  // Animation variants
  const containerVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariant = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  // SVG path for the chart
  // const chartPath = "M50,270 L80,250 L110,260 L140,240 L170,220 L200,230 L230,180 L260,150 L290,200 L320,230 L350,200 L380,180";

  return (
    <div className="p-6 w-full min-h-screen">
      <motion.h1
        className="text-3xl font-bold text-gray-800 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Funding Updates
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        variants={containerVariant}
        initial="hidden"
        animate="visible"
      >
        {/* Total Raised Card */}
        <motion.div
          className="bg-white rounded-lg p-4 shadow-sm"
          variants={itemVariant}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="mb-2">
            <span className="text-sm text-gray-600">Total Raised</span>
            <span className="float-right text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              +12.5%
            </span>
          </div>
          <div className="mb-3">
            <span className="text-blue-500 text-lg font-bold">$5,653</span>
            <span className="text-gray-500"> / $10,000</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-green-400 h-2 rounded-full"
              style={{ width: '56%' }}
              initial={{ width: 0 }}
              animate={{ width: '56%' }}
              transition={{ duration: 1 }}
            />
          </div>
        </motion.div>

        {/* Active Investors Card */}
        <motion.div
          className="bg-white rounded-lg p-4 shadow-sm"
          variants={itemVariant}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="mb-2">
            <span className="text-sm text-gray-600">Active Investors</span>
            <span className="float-right text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              +9 this month
            </span>
          </div>
          <div className="mb-3">
            <span className="text-lg font-bold">145</span>
          </div>
          <div className="flex -space-x-2">
            <motion.div
              whileHover={{ y: -3 }}
              className="w-8 h-8 rounded-full bg-orange-400 border-2 border-white flex items-center justify-center text-white text-xs"
            >
              JD
            </motion.div>
            <motion.div
              whileHover={{ y: -3 }}
              className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-white"
            ></motion.div>
            <motion.div
              whileHover={{ y: -3 }}
              className="w-8 h-8 rounded-full bg-green-400 border-2 border-white"
            ></motion.div>
            <motion.div
              whileHover={{ y: -3 }}
              className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs"
            >
              +99
            </motion.div>
          </div>
        </motion.div>

        {/* Performance Card */}
        <motion.div
          className="bg-blue-500 text-white rounded-lg p-4 shadow-sm"
          variants={itemVariant}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="mb-2">
            <span className="text-sm">Performance</span>
          </div>
          <div className="mb-3">
            <span className="text-lg font-bold">90%</span>
          </div>
          <div className="w-full bg-blue-400 bg-opacity-50 rounded-full h-2">
            <motion.div
              className="bg-white h-2 rounded-full"
              style={{ width: '90%' }}
              initial={{ width: 0 }}
              animate={{ width: '90%' }}
              transition={{ duration: 1 }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Chart Section */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.div
          className="md:col-span-3 bg-white p-4 rounded-lg shadow-sm"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="flex justify-between mb-6">
            <div>
              <h3 className="font-medium text-gray-700">Orders Over Time</h3>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <div className="text-lg font-semibold">645</div>
                  <div className="text-xs text-gray-500">Orders on May 22</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">472</div>
                  <div className="text-xs text-gray-500">Orders on May 21</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Last 12 Months</div>
          </div>
          <div className="relative h-60 w-full"></div>
        </motion.div>

        {/* Quick Action Card */}
        <motion.div
          className="bg-white rounded-lg p-4 shadow-sm border border-blue-200 border-dashed"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <h3 className="font-medium text-gray-700 text-center mb-4">Quick Action</h3>
          <div className="space-y-3">
            <motion.button
              className="w-full py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02, backgroundColor: '#1E40AF' }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 6V18M18 12H6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Start New Funding Round
            </motion.button>

            <motion.button
              className="w-full py-2 border border-blue-500 text-blue-500 rounded-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4V20M4 12H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Update Financial Round
            </motion.button>

            <motion.button
              className="w-full py-2 border border-blue-500 text-blue-500 rounded-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 8L21 12M21 12L17 16M21 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Manage Investors
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Activities Section */}
      <motion.div
        className="bg-white rounded-lg shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-700">Recent Activities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentActivities.map((activity, index) => (
                <motion.tr
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200"></div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{activity.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-500">{activity.amount}</div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default FundingUpdates;

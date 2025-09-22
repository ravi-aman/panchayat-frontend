import { motion } from 'framer-motion';

interface Props {
  sidebarTabs: string[];
  sideBarTitle: string;
  setSidebarTitle?: (title: string | null) => void;
  setSidebarTabs?: (tabs: string[] | null) => void;
}

export default function SectionInfo({
  sideBarTitle,
  sidebarTabs,
  setSidebarTitle,
  setSidebarTabs,
}: Props) {
  return (
    <motion.div
      className="mx-auto px-4 py-10"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <button
        className="mb-4 flex items-center text-blue-600 hover:underline focus:outline-none"
        onClick={() => {
          if (setSidebarTitle) setSidebarTitle(null);
          if (setSidebarTabs) setSidebarTabs(null);
        }}
      >
        &#8592; Back
      </button>
      <motion.h1
        className="text-3xl font-bold text-gray-900 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {sideBarTitle}
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Sidebar Tabs */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {sidebarTabs.map((tab, idx) => (
            <motion.button
              key={idx}
              className={`w-full text-left px-5 py-3 rounded-lg transition font-medium ${
                idx === 0 ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50 text-gray-800'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {tab}
            </motion.button>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="md:col-span-3 space-y-10"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Intro Section */}
          <motion.section
            className="bg-white rounded-xl shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Introduction to Product</h2>
            <p className="text-gray-700 mb-3">
              Bolt is a content management system (CMS). Subscription includes content hosting,
              professionally designed layouts, 24/7 support, and access to our user-friendly
              platform for managing your business. You can use Bolt to create management systems.
            </p>
            <div className="mt-2 p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-700 rounded">
              <strong>Recommended:</strong> Learn faster by watching onboarding videos in the video
              gallery.
            </div>
          </motion.section>

          {/* Starting Guide */}
          <motion.section
            className="bg-white rounded-xl shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Starting Guide</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 pl-4">
              <li>
                All billing plans are available on monthly and annual payment cycles. On an annual
                billing cycle, the average monthly cost is lower, and you can get 3 months free.
              </li>
              <li>
                Upgrade to paid service to make your site public. If you need more time to design
                your site before going live, you can hide it behind a password.
              </li>
              <li>
                Site has a trial period. Trial period is a free two-week period where you can
                explore the platform, upload content, and experiment with your ecommerce website.
              </li>
            </ol>
          </motion.section>

          {/* Additional Info */}
          <motion.section
            className="bg-white rounded-xl shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Additional Information</h2>
            <div className="flex flex-wrap gap-4 text-sm text-blue-600 font-medium mb-3">
              <span className="cursor-pointer hover:underline">Onboarding</span>
              <span className="cursor-pointer hover:underline">Tutorials</span>
              <span className="cursor-pointer hover:underline">Guides for Beginners</span>
            </div>
            <p className="text-gray-700">
              In addition to our guides and video tutorials, we offer webinars to help you get
              comfortable and explore our product functionality. In our webinars, we walk you
              through the basics of setting up and growing your business.
            </p>
            <p className="text-gray-700 mt-2">
              After it ends, we’ll email you a video link to the webinar so you can remember
              everything you have learned anytime. If you can’t attend the webinar at its scheduled
              time, you can watch it later.
            </p>
          </motion.section>

          {/* Feedback */}
          <motion.section
            className="bg-white rounded-xl shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <h2 className="text-sm font-medium text-gray-800 mb-2">Was this article helpful?</h2>
            <div className="flex space-x-4 mb-2">
              <motion.button
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                Yes
              </motion.button>
              <motion.button
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                No
              </motion.button>
            </div>
            <p className="text-sm text-gray-500">50 people found this article helpful</p>
          </motion.section>
        </motion.div>
      </div>
    </motion.div>
  );
}

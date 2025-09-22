import { motion } from 'framer-motion';
// import commigSoon from "../../../assets/coming_soon.mp4";
import { SectionInfo, Sections } from '../../../components/dashboard/knowledgeBase';
import { useState } from 'react';

const KnowledgeBase = () => {
  const [sidebarTitle, setSidebarTitle] = useState<string | null>(null);
  const [sidebarTabs, setSidebarTabs] = useState<Array<string> | null>(null);
  // return(
  //     <div>

  //         <video src={commigSoon} autoPlay loop muted className="h-screen"/>
  //     </div>
  //     )

  return (
    <div className="w-full min-h-screen p-6 bg-gray-100">
      {!sidebarTabs && !sidebarTitle ? (
        <Sections setSidebarTabs={setSidebarTabs} setSidebarTitle={setSidebarTitle} />
      ) : (
        <SectionInfo
          sideBarTitle={sidebarTitle ?? ''}
          sidebarTabs={sidebarTabs ?? []}
          setSidebarTabs={setSidebarTabs}
          setSidebarTitle={setSidebarTitle}
        />
      )}

      <motion.div
        className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Community Forum</h2>
          <p className="mb-4 text-sm text-gray-600">
            Get help from community members, ask any questions and get answers faster.
          </p>
          <motion.button
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Join Community
          </motion.button>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Webinars</h2>
          <p className="mb-4 text-sm text-gray-600">
            Join our series of webinars where you can ask questions live and see a presentation.
          </p>
          <motion.button
            className="px-4 py-2 text-sm text-blue-500 border border-blue-500 rounded-md"
            whileHover={{
              scale: 1.05,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
            }}
            whileTap={{ scale: 0.95 }}
          >
            Register
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        className="py-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 className="mb-2 text-xl font-bold">Still Need Help?</h2>
        <p className="mb-4 text-gray-600">
          Get in touch with us and we will be happy to help you out!
        </p>
        <motion.button
          className="px-6 py-2 text-white bg-blue-500 rounded-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Contact Support
        </motion.button>
      </motion.div>
    </div>
  );
};

export default KnowledgeBase;

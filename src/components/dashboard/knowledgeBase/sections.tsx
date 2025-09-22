import { motion } from 'framer-motion';
import { sections } from '../../../data/KnowledgeBase';

interface SectionProps {
  setSidebarTitle: (title: string | null) => void;
  setSidebarTabs: (tabs: Array<string> | null) => void;
}

export default function Sections({ setSidebarTitle, setSidebarTabs }: SectionProps) {
  const fadeInUp = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.4 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <>
      <motion.div
        className="mx-auto px-4 py-10 w-full"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-3xl font-bold text-blue-900 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Knowledge Base
        </motion.h1>

        <motion.div
          className="relative mb-8 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-3.5 text-gray-400 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {sections.map((section, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => {
                setSidebarTitle(section.title);
                setSidebarTabs(section.links);
              }}
              initial="initial"
              animate="animate"
              variants={fadeInUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 p-4 rounded-lg mb-4">
                  <div className="w-16 h-16 flex items-center justify-center">
                    {/* Replace with actual icons */}
                    <div
                      className={`w-12 h-12 bg-blue-500 rounded ${
                        index === 1 ? 'rounded-full' : ''
                      }`}
                    ></div>
                  </div>
                </div>
                <h2 className="font-bold text-lg mb-4">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="text-gray-600 text-sm hover:text-blue-500">
                    {link}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <a href="#" className="text-blue-500 text-sm hover:underline">
                  More Tutorials
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </>
  );
}

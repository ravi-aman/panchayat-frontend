import { motion } from 'framer-motion';
import MsmeCard from '../../../components/dashboard/MsmeCard.tsx';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext.tsx';
import { Company } from '../../../types/company.ts';

interface ApiResponse {
  status: string;
  companies: Company[];
}

const Msme: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchMsmes = async () => {
      try {
        const response = await axios.get<ApiResponse>(
          `${import.meta.env.VITE_BACKEND_URL}/api/v1/company/msme/`,
        );
        if (response.data.status === 'success' && Array.isArray(response.data.companies)) {
          console.log('Fetched MSMEs:', response.data.companies);
          setAllCompanies(response.data.companies);
          setCompanies(response.data.companies);
        } else {
          console.error('Invalid response structure:', response.data);
        }
      } catch (error) {
        console.error('Error fetching msmes:', error);
      }
    };

    fetchMsmes();
  }, []);

  // Filter companies based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setCompanies(allCompanies);
    } else {
      const filtered = allCompanies.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.tagline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.city?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setCompanies(filtered);
    }
  }, [searchTerm, allCompanies]);

  return (
    <motion.div
      className="w-full p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between">
        <div className="py-4">
          <motion.h1
            className="text-3xl w-full font-bold"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            Explore MSMEs
          </motion.h1>
          <motion.p
            className="hidden md:block text-gray-600 text-lg mt-3"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Discover various MSMEs ideas to help grow
          </motion.p>
        </div>
        <motion.button
          className="bg-[#1E5EFF] rounded-sm p-2 flex gap-1 text-white font-semibold px-3 transition-all duration-300 hover:bg-blue-700 active:scale-95 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =>
            (window.location.href = isAuthenticated() ? '/msme/register' : '/auth/signin')
          }
        >
          <h1 className="text">Create MSME</h1>
          <img src="/dashboard/plus.png" className="w-5 h-5 self-center" alt="" />
        </motion.button>
      </div>

      <motion.div
        className="flex items-center flex-1 mb-5 px-3 bg-white rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1, delay: 0.1 }}
        whileHover={{ boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          className="text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search MSME..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-3 outline-none w-full text-sm"
        />
      </motion.div>

      <motion.div
        className="grid md:grid-cols-2 gap-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.15 },
          },
        }}
      >
        {companies.length === 0 ? (
          <motion.div
            className="col-span-full text-center py-12"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-gray-500 text-lg">
              {searchTerm.trim() ? 'No MSMEs found matching your search.' : 'No MSMEs available.'}
            </p>
            {searchTerm.trim() && (
              <p className="text-gray-400 text-sm mt-2">Try searching with different keywords.</p>
            )}
          </motion.div>
        ) : (
          companies.map((company) => (
            <motion.div
              key={company._id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5 }}
            >
              <MsmeCard company={company} />
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
};

export default Msme;

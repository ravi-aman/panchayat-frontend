import { motion } from 'framer-motion';
import { useState } from 'react';
import { IoClose, IoMenu } from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import { PANCHAYAT_BRANDING } from '../../config/branding';

export default function Navbar() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-100"
    >
      <div className={`w-full p-8 z-50 max-sm:flex hidden bg-white justify-center`}>
        <button
          onClick={() => setMenuOpen(!isMenuOpen)}
          className="w-full flex justify-start align-middle"
        >
          {isMenuOpen ? (
            <IoClose className="self-center" size={30} />
          ) : (
            <IoMenu className="self-center" size={30} />
          )}
        </button>
        <motion.div className="flex flex-col items-center">
          <img
            src="https://temp-data-aws.s3.ap-south-1.amazonaws.com/uploads/company/68d1c8708e09707f4bb3cf4f/Black_and_White_Minimalist_Music_Studio_Logo__3__1758784871943_a73efde3.png"
            alt={PANCHAYAT_BRANDING.name}
            className="w-35 hover:cursor-pointer"
          />
          {/* <span className="text-xs text-gray-600 text-center mt-1">{PANCHAYAT_BRANDING.tagline}</span> */}
        </motion.div>
        <div className="w-full" />
      </div>
      <div
        className={`bg-white max-sm:${isMenuOpen ? 'block' : 'hidden'} shadow-md px-10 py-4 flex max-sm:flex-col max-sm:h-[90vh] items-center max-sm:justify-around justify-between`}
      >
        <motion.div 
          className="flex flex-col items-center max-sm:hidden"
          whileHover={{ scale: 1.05 }}
        >
          <img
            src="https://temp-data-aws.s3.ap-south-1.amazonaws.com/uploads/company/68d1c8708e09707f4bb3cf4f/Black_and_White_Minimalist_Music_Studio_Logo__3__1758784871943_a73efde3.png"
            alt={PANCHAYAT_BRANDING.name}
            className="w-35 hover:cursor-pointer"
          />
          {/* <span className="text-xs text-gray-600 text-center mt-1">{PANCHAYAT_BRANDING.tagline}</span> */}
        </motion.div>

        {/* <div className="flex max-sm:w-full max-sm:flex-col max-sm:p-5 space-x-10 gap-8  ">
                    {["Home", "Funds", "Startups", "MSME's", "Features"].map((item) => (
                        <a
                            key={item}
                            href="#"
                            className="text-gray-600 max-sm:text-center max-sm:w-full hover:text-blue-600 transition-colors duration-300 text-[16px]"
                        >
                            {item}
                        </a>
                    ))}
                </div> */}
        <div className="flex max-sm:flex-col max-sm:w-full max-sm:align-middle max-sm:gap-5 space-x-4 max-sm:space-x-0 max-sm:p-5">
          {!isAuthenticated() && (
            <>
              <motion.a
                href="/auth/signin"
                className="bg-blue-700 max-sm:self-center max-sm:w-fit py-1 px-6 rounded-[8px] text-white hover:bg-blue-600 transition duration-300 font-bold"
                whileHover={{ scale: 1.05 }}
              >
                Login
              </motion.a>

              <motion.a
                href="/auth/signup"
                className="border-2 max-sm:w-fit max-sm:self-center border-blue-700 py-1 px-6  rounded-[8px] text-blue-700 hover:bg-blue-600 hover:text-white transition duration-300 font-bold"
                whileHover={{ scale: 1.05 }}
              >
                Register
              </motion.a>
            </>
          )}

          <motion.a
            href="/dashboard/feed"
            className="border-2 max-sm:w-fit max-sm:self-center border-blue-700 py-1 px-6  rounded-[8px] text-blue-700 hover:bg-blue-600 hover:text-white transition duration-300 font-bold"
            whileHover={{ scale: 1.05 }}
          >
            Explore
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

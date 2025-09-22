import { motion } from 'framer-motion';
import { useState } from 'react';
import { IoClose, IoMenu } from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

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
        <motion.img
          src="./logo.png"
          alt="Logo"
          className="w-35 hover:cursor-pointer"
          whileHover={{ scale: 1.05 }}
        />
        <div className="w-full" />
      </div>
      <div
        className={`bg-white max-sm:${isMenuOpen ? 'block' : 'hidden'} shadow-md px-10 py-4 flex max-sm:flex-col max-sm:h-[90vh] items-center max-sm:justify-around justify-between`}
      >
        <motion.img
          src="./logo.png"
          alt="Logo"
          className="w-35 hover:cursor-pointer max-sm:hidden"
          whileHover={{ scale: 1.05 }}
        />

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
            href="/dashboard/startups"
            className="border-2 max-sm:w-fit max-sm:self-center border-blue-700 py-1 px-6  rounded-[8px] text-blue-700 hover:bg-blue-600 hover:text-white transition duration-300 font-bold"
            whileHover={{ scale: 1.05 }}
          >
            Startups
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}

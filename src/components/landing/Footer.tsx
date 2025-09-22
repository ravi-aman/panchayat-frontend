import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true }}
      className="bg-[#131523] pt-32 pb-20 px-40 max-sm:px-10 max-sm:py-20"
    >
      <footer className="text-white px-6 md:px-16 max-sm:p-0">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <div className="max-w-[300px]">
              <h2 className="text-2xl font-bold">Neecop</h2>
              <p className="text-gray-400 mt-2">
                Bridging Future Partnerships through right access to investors, partners, and
                mentors.
              </p>
            </div>

            <div className="flex max-sm:flex-col gap-3 mt-6 text-2xl">
              <a
                href="tel:+91 8595870292"
                className="border px-7 py-4 max-sm:px-6 max-sm:py-2 rounded-full text-sm flex items-center"
              >
                +91 8595870292
              </a>
              <a
                href="mailto:support@neecop.com"
                className="border px-7 py-4 max-sm:px-6 max-sm:py-2 rounded-full text-sm flex items-center"
              >
                support@neecop.com
              </a>
            </div>

            <div className="flex max-sm:flex-col gap-3 mt-6 text-2xl">
              <a
                href="tel:+91 7290908877"
                className="border px-7 py-4 max-sm:px-6 max-sm:py-2 rounded-full text-sm flex items-center"
              >
                +91 7290908877
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="border-t border-gray-800 my-6"
        ></motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="mx-auto flex flex-col md:flex-row items-center text-gray-400 text-sm w-full justify-between"
        >
          <div className="min-w-[300px] max-sm:w-full max-sm:items-center flex flex-col gap-6 mr-20 max-sm:m-0 items-start">
            <div className="flex gap-8 mb-4 md:mb-0">
              <FaFacebookF className="cursor-pointer text-2xl hover:text-white transition duration-300" />
              <FaTwitter className="cursor-pointer text-2xl hover:text-white transition duration-300" />
              <FaInstagram className="cursor-pointer text-2xl hover:text-white transition duration-300" />
              <a target="_blank" href="https://www.linkedin.com/company/neecop/posts/?feedView=all">
                <FaLinkedin className="cursor-pointer text-2xl hover:text-white transition duration-300" />
              </a>
            </div>
          </div>

          <div className="flex flex-col max-sm:flex-row md:flex-row gap-12 max-sm:gap-6 max-sm:pt-12 p-5 justify-end w-full">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h4 className="font-medium text-white">Company</h4>
              <ul className="mt-2 space-y-3 max-sm:space-y-2">
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/dashboard/startups">Company</a>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h4 className="font-medium text-white">Resources</h4>
              <ul className="mt-2 space-y-3 max-sm:space-y-2">
                <li>
                  <a href="/privacy_policy" target="_blank">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms_of_service" target="_blank">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <h4 className="font-medium text-white">Product</h4>
              <ul className="mt-2 space-y-3 max-sm:space-y-2">
                <li>
                  <a href="/product">Product</a>
                </li>
                <li>
                  <a href="/pricing">Pricing</a>
                </li>
                <li>
                  <a href="/login">Login</a>
                </li>
                <li>
                  <a href="/register">Register</a>
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </footer>
    </motion.div>
  );
};

export default Footer;

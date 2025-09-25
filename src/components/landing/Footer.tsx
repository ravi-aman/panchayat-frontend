import { FaFacebookF, FaTwitter, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { PANCHAYAT_BRANDING } from '../../config/branding';

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
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <div className="max-w-[400px]">
              <h2 className="text-3xl font-bold">{PANCHAYAT_BRANDING.name}</h2>
              <p className="text-xl text-white-400 mb-4">{PANCHAYAT_BRANDING.tagline}</p>
              <p className="text-gray-400 mt-2 leading-relaxed">
                {PANCHAYAT_BRANDING.mission}
              </p>
              
              {/* Key Features */}
              <div className="mt-6">
                <h4 className="font-semibold text-white mb-3">Platform Highlights:</h4>
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span>Real-time civic issue reporting</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Interactive community maps</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Government transparency dashboard</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>AI-powered issue classification</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex max-sm:flex-col gap-3 mt-8 text-2xl">
              <a
                href={`mailto:${PANCHAYAT_BRANDING.contact.email}`}
                className="border border-gray-600 px-6 py-3 max-sm:px-4 max-sm:py-2 rounded-full text-sm flex items-center hover:bg-blue-600 hover:border-blue-600 transition-colors"
              >
                📧 {PANCHAYAT_BRANDING.contact.email}
              </a>
              <a
                href={`tel:${PANCHAYAT_BRANDING.contact.phone}`}
                className="border border-gray-600 px-6 py-3 max-sm:px-4 max-sm:py-2 rounded-full text-sm flex items-center hover:bg-green-600 hover:border-green-600 transition-colors"
              >
                📱 {PANCHAYAT_BRANDING.contact.phone}
              </a>
            </div>

            {/* Social Media Links */}
            <div className="flex gap-4 mt-6">
              <a href={PANCHAYAT_BRANDING.social.twitterUrl} target="_blank" rel="noopener noreferrer">
                <FaTwitter className="cursor-pointer text-2xl hover:text-blue-400 transition duration-300" />
              </a>
              <a href={PANCHAYAT_BRANDING.social.linkedin} target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="cursor-pointer text-2xl hover:text-blue-600 transition duration-300" />
              </a>
              <a href={PANCHAYAT_BRANDING.social.facebook} target="_blank" rel="noopener noreferrer">
                <FaFacebookF className="cursor-pointer text-2xl hover:text-blue-500 transition duration-300" />
              </a>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="cursor-pointer text-2xl hover:text-green-500 transition duration-300" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <div className="flex flex-col max-sm:flex-row md:flex-row gap-12 max-sm:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="space-y-4 min-w-[150px]"
            >
              <h4 className="font-medium text-white">Platform</h4>
              <ul className="mt-2 space-y-3 max-sm:space-y-2 text-gray-400">
                <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
                <li><a href="/dashboard/heatmap" className="hover:text-white transition-colors">Live Map</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="/dashboard/chat" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="space-y-4 min-w-[150px]"
            >
              <h4 className="font-medium text-white">For Government</h4>
              <ul className="mt-2 space-y-3 max-sm:space-y-2 text-gray-400">
                <li><a href="/government" className="hover:text-white transition-colors">Admin Dashboard</a></li>
                <li><a href="/analytics" className="hover:text-white transition-colors">Analytics</a></li>
                <li><a href="/api" className="hover:text-white transition-colors">API Access</a></li>
                <li><a href="/integrations" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="space-y-4 min-w-[150px]"
            >
              <h4 className="font-medium text-white">Resources</h4>
              <ul className="mt-2 space-y-3 max-sm:space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white transition-colors">About Panchayat</a></li>
                <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="border-t border-gray-700 my-8"
        />

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
            <p>&copy; 2024 {PANCHAYAT_BRANDING.name}. All rights reserved.</p>
            {/* <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-green-600 text-white rounded-full">🌱 Digital India</span>
              <span className="px-2 py-1 bg-blue-600 text-white rounded-full">🏛️ Smart Cities Mission</span>
            </div> */}
          </div>
        </motion.div>
      </footer>
    </motion.div>
  );
};

export default Footer;

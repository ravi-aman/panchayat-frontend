import { motion } from 'framer-motion';
import { PANCHAYAT_BRANDING } from '../../config/branding';

export default function SublimeProducts() {
  return (
    <motion.div
      className="relative md:p-25 max-sm:p-6 py-20"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true }}
    >
      <div
        className="absolute max-sm:w-full max-sm:inset-0 inset-50 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/landing/sublimeBackground.png')",
          zIndex: -1,
        }}
      />

      <div className="md:p-8 max-sm:p-0 rounded-lg relative">
        <motion.div
          className="space-y-2 mb-15"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h2 className="text-sm text-black font-medium">{PANCHAYAT_BRANDING.name.toUpperCase()}</h2>
          <div className="flex max-sm:flex-col max-sm:gap-5 items-start justify-between">
            <h1 className="text-6xl max-sm:text-3xl font-semibold">
              Our <br /> Features!
            </h1>
            <div className="flex flex-col gap-2 max-sm:w-full w-[500px]">
              <div className="flex flex-row gap-5">
                <motion.img
                  className="w-5 h-5 text-blue-500 mb-4"
                  src="/landing/star1.png"
                  alt=""
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
                  viewport={{ once: true }}
                />
                <motion.img
                  className="w-5 h-5 text-blue-500 mb-4"
                  src="/landing/star2.png"
                  alt=""
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
                  viewport={{ once: true }}
                />
              </div>
              <h1 className="text-[18px]">
                {PANCHAYAT_BRANDING.tagline} - Comprehensive civic engagement platform for transparent governance.
              </h1>
            </div>
          </div>
        </motion.div>

        <div className="relative grid grid-cols-3 max-sm:grid-cols-2 max-sm:gap-3 gap-6">
          {[
            {
              title: 'One-Tap Issue Reporting',
              image: `./landing/chat.png`,
              text: 'Mobile-first interface with photo, video, voice, and location tagging.',
            },
            {
              title: 'Interactive Maps',
              image: `./landing/call.png`,
              text: 'Live issue markers with color-coded status and heatmaps for density analysis.',
            },
            {
              title: 'AI-Powered Intelligence',
              image: `./landing/hand.png`,
              text: 'Smart issue classification and duplicate detection with priority scoring.',
            },
            {
              title: 'Government Dashboard',
              image: `./landing/time.png`,
              text: 'Smart routing engine auto-assigns issues to relevant departments.',
            },
            {
              title: 'Social Amplification',
              image: `./landing/cloud.png`,
              text: 'Share issues to WhatsApp, Twitter with auto-escalation for trending problems.',
            },
            {
              title: 'Real-time Notifications',
              image: `./landing/speaker.png`,
              text: 'Status updates from report to resolution with community collaboration.',
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 max-sm:p-3 rounded-xl shadow-sm h-[300px] flex flex-col max-sm:justify-around justify-between"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div>
                <motion.img
                  className="w-10 h-10 max-sm:w-5 max-sm:h-5 mb-4"
                  src={item.image}
                  alt={item.title}
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                  viewport={{ once: true }}
                />
                <h3 className="text-3xl max-sm:text-xl mb-3">{item.title}</h3>
                <p className="text-gray-600 max-sm:text-sm">{item.text}</p>
              </div>
              <motion.button
                className="border-black/60 border w-25 h-13 max-sm:w-14 max-sm:h-8 flex justify-center rounded-full items-center hover:border-blue-600"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
                viewport={{ once: true }}
              >
                <img className="h-10 w-10 max-sm:w-5 max-sm:h-5" src="./landing/arrow.png" alt="" />
              </motion.button>
            </motion.div>
          ))}
          <motion.img
            className="absolute left-[-90px] bottom-[-73px] w-[400px] h-auto"
            src="/landing/rightcover.png"
            alt="Left Cover"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
            viewport={{ once: true }}
          />
          <motion.img
            className="absolute right-[-87px] bottom-[-73px] w-[400px] h-auto"
            src="/landing/leftcover.png"
            alt="Right Cover"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
            viewport={{ once: true }}
          />
        </div>
      </div>
    </motion.div>
  );
}

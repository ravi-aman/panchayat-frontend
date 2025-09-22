import { motion } from 'framer-motion';

function Ready() {
  return (
    <motion.div
      className="px-50 py-20 max-sm:p-10 max-sm:pt-0"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col justify-center items-center">
        <h1 className="text-6xl max-sm:text-3xl font-bold text-center">
          Ready to start your <span className="text-blue-600">Journey</span> ?
        </h1>
        <p className="text-center py-10 max-sm:py-6 text-2xl max-sm:w-full max-sm:text-xl w-[600px]">
          Start your journey with NEECOP today and scale your business with confidence!
        </p>
        <motion.button
          className="bg-blue-600 py-5 max-sm:py-2 max-sm:px-8 px-12 font-bold text-white rounded-4xl my-5 max-sm:my-0 hover:bg-blue-500"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          viewport={{ once: true }}
        >
          Start Now!
        </motion.button>
      </div>
    </motion.div>
  );
}

export default Ready;

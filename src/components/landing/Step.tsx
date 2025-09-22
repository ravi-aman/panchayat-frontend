import { motion } from 'framer-motion';

const Step = () => {
  return (
    <div className="relative px-25 pt-20 max-sm:pt-10 max-sm:px-10 pb-10">
      <div className="flex flex-col w-full">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="title-section max-w-[500px] text-left"
        >
          <p className="text-blue-500 uppercase font-semibold text-sm mb-2">
            Find the best Business Venture/Msme to invest
          </p>
          <h1 className="text-4xl max-sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
            Diversifying Partnerships <br />
            for Exponential Growth.
          </h1>
          <p className="text-gray-600 mb-6 font-semibold text-start">
            Connect with investors, partners, industry experts and fellow entrepreneurs to unlock
            the full potential of your Business Venture.
          </p>
          <button className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition">
            Get Started
          </button>
        </motion.div>
        <div className="w-full mt-10 max-sm:hidden">
          <img
            src="./landing/step.png"
            alt="step"
            className="w-[90%] h-auto relative top-[-300px]"
          />
          <div className="absolute">
            <div className="relative w-[270px] top-[-450px] left-[340px] text-[200px] font-bold text-[#1E5EFF] opacity-10">
              1
            </div>
            <div className="relative flex flex-col gap-6 w-[270px] top-[-570px] left-[170px]">
              <h3 className="text-blue-600 font-bold text-xl">Create a Profile</h3>
              <p className="text-gray-500 font-semibold text-lg">
                Create your profile and start your entrepreneurial journey now!
              </p>
            </div>
            <div className="relative flex flex-col gap-6 w-[270px] top-[-1320px] left-[1200px] font-bold text-[200px] text-[#1E5EFF] opacity-10">
              3
            </div>
            <div className="relative flex flex-col gap-6 w-[270px] top-[-1420px] left-[1020px]">
              <h3 className="text-blue-600 font-bold text-xl">Find Grants & Find Team</h3>
              <p className="text-gray-500 font-semibold text-lg">
                Discover investment opportunities and strategic partnerships to scale your business!
              </p>
            </div>
            <div className="relative flex flex-col gap-6 w-[270px] top-[-1480px] left-[850px] text-[200px] font-bold text-[#1E5EFF] opacity-10">
              2
            </div>
            <div className="relative flex flex-col gap-6 w-[270px] top-[-1590px] left-[670px]">
              <h3 className="text-blue-600 font-bold text-xl">Build your connections</h3>
              <p className="text-gray-500 font-semibold text-lg">
                Find appropriate partners, team members, co-founders, mentors and share your
                business idea.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step;

import { motion } from 'framer-motion';

const HeroBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="px-25 max-sm:px-5 py-20 max-sm:py-10 relative"
    >
      <div className="w-full bg-[#2563EB] rounded-4xl max-sm:rounded-2xl overflow-hidden p-12 max-sm:p-10 relative z-10">
        <div
          className="absolute inset-0 max-sm:hidden bg-cover bg-no-repeat opacity-50"
          style={{
            backgroundImage: `url('/landing/bannerBackround.png')`,
            backgroundPosition: 'left bottom',
            backgroundSize: '50% auto',
            zIndex: 0,
          }}
        />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 max-sm:gap-10 relative z-20">
          <div className="w-fit">
            <h1 className="text-white text-5xl max-sm:text-3xl font-bold leading-tight">
              From Everyday Problems to Community-Driven Solutions
            </h1>
          </div>
          <div className="w-1/2 max-sm:w-full space-y-4">
            <FeatureCard
              icon="/landing/1.png"
              title="Community Power"
              description="Report and support issues together with your neighbors, making every voice count in shaping a better city."
            />
            <FeatureCard
              icon="/landing/2.png"
              title="Smart Tracking"
              description="Follow your report in real time with live maps, updates, and notifications at every stage."
            />
            <FeatureCard
              icon="/landing/3.png"
              title="Trusted Resolution"
              description="Seamlessly connect with the right municipal department and ensure issues are resolved transparently."
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="border-white/20 border rounded-2xl p-2 flex items-center gap-4 backdrop-blur-lg">
      <div className="w-14 h-20 flex justify-center items-center bg-white/20 rounded-lg">
        <img src={icon} alt={title} className="w-7 h-7" />
      </div>
      <div className="w-full">
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-white/80 text-sm">{description}</p>
      </div>
    </div>
  );
};

export default HeroBanner;

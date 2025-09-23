import { motion } from 'framer-motion';
import { useEffect } from 'react';
import Navbar from '../components/common/navbar';
import Hero from '../components/landing/hero';
import HeroBanner from '../components/landing/HeroBanner';
import OurValues from '../components/landing/OurValue';
import SublimeProducts from '../components/landing/sublimeProduct';
import PowerSection from '../components/landing/Power';
import FAQ from '../components/landing/FAQ';
import Ready from '../components/landing/Ready';
import Footer from '../components/landing/Footer';
import Step from '../components/landing/Step';
import MeetStellar from '../components/landing/MeetStellar';

function LandingPage() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div className="relative">
        <Navbar />
        <Hero />
        <HeroBanner />
        <Step />
        <OurValues />
        <SublimeProducts />
        <MeetStellar />
        <PowerSection />
        <Ready />
        <FAQ />
        <Footer />
      </div>
    </motion.div>
  );
}

export default LandingPage;

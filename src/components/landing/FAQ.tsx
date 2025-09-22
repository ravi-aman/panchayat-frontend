import { motion } from 'framer-motion';

const FAQ = () => {
  return (
    <motion.div
      className="px-25 pb-20 max-sm:p-10"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true }}
    >
      <section className="py-12 max-sm:py-0">
        <div className="mx-auto">
          <h2 className="text-xl font-semibold text-gray-900">Creative Freedom</h2>
          <div className="flex flex-col md:flex-row md:justify-between items-start mt-4">
            <div className="flex flex-col gap-4 ">
              <h3 className="text-5xl max-sm:text-3xl font-semibold text-gray-900">
                Frequently Asked
              </h3>
              <div className="text-5xl max-sm:text-2xl text-white bg-blue-600 p-3 max-sm:p-1 rounded-md w-fit">
                Questions
              </div>
            </div>
            <p className="text-gray-600 text-[18px] max-sm:w-full max-w-[500px] mt-4 md:mt-0">
              Your success is our priority. Our team is here to assist you at every step of the way.
            </p>
          </div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 mt-8"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            {[
              {
                title: 'How does NEECOP help in securing investments?',
                text: 'We connect MSMEs and Business Venture with potential investors by providing visibility, data-driven insights, and networking opportunities within our ecosystem.',
              },
              {
                title: 'Is there a process to list my Business Venture/MSME for investment?',
                text: 'Yes! You can submit your business details through our platform. Our team will review and help connect you with relevant investors and stakeholders.',
              },
              {
                title: 'Does NEECOP provide valuation and financial insights for businesses?',
                text: 'Yes! We are working on an independent valuation system for MSMEs to help them assess their financial standing and investment potential.',
              },
              {
                title: 'How does NEECOP ensure credibility in partnerships?',
                text: 'We verify businesses and investors through a structured due diligence process, ensuring trustworthy collaborations.',
              },
              {
                title: 'What is the NEECOP Discovery Platform?',
                text: 'The NEECOP Discovery Platform is a one-stop digital ecosystem where MSMEs, Business Venture, and investors can connect, explore collaboration opportunities, and gain industry insights',
              },
              {
                title: 'Can I list my business on the Discovery Platform?',
                text: 'Yes! By creating a profile on the Discovery Platform, you can showcase your business to potential investors, partners, and customers. ',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                className="bg-white shadow-md rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <h4 className="text-blue-600 font-semibold">{faq.title}</h4>
                <p className="text-gray-600 mt-2">{faq.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default FAQ;

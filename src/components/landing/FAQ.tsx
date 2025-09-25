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
          <h2 className="text-xl font-semibold text-gray-900">Civic Engagement</h2>
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
              Empowering citizens to create better communities through transparent, data-driven civic engagement.
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
                title: 'How does Panchayat help resolve civic issues?',
                text: 'Citizens report issues with photos/location, AI auto-categorizes and routes to relevant departments, and the community can track resolution in real-time on our interactive map.',
              },
              {
                title: 'Can I report issues via WhatsApp?',
                text: 'Yes! Our WhatsApp bot allows one-tap issue reporting. Just send a photo and location, and we\'ll handle the rest - categorization, department routing, and status updates.',
              },
              {
                title: 'How does the AI-powered classification work?',
                text: 'Our ML models analyze photos and text to automatically detect issue types (potholes, garbage, streetlights) and smart duplicate detection merges similar reports for clarity.',
              },
              {
                title: 'How does Panchayat ensure government accountability?',
                text: 'Public dashboards show resolved vs pending issues for each ward/city. Trending issues auto-escalate to higher authorities and get tagged on social media for maximum visibility.',
              },
              {
                title: 'What is the Panchayat Interactive Map?',
                text: 'Our map shows India down to ward/colony levels with live issue markers color-coded by status, heatmaps for issue density, and department/service overlays for complete transparency.',
              },
              {
                title: 'Can NGOs and organizations adopt issues?',
                text: 'Yes! NGOs, RWAs, and private organizations can adopt issues as CSR opportunities, fostering community collaboration and faster resolution through collective action.',
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

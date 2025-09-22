import { motion } from 'framer-motion';

export default function PowerSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true }}
      className="px-35 pb-20 max-sm:px-10 max-sm:pb-10"
    >
      <section className="relative w-full py-16  max-sm:pb-0 bg-center bg-no-repeat inset-0 bg-cover">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center mb-16 max-w-2xl mx-auto flex justify-center items-center flex-col"
          >
            {/* Removed animation from poercover.png */}
            <img className="absolute max-sm:hidden" src="/public/landing/poercover.png" alt="" />

            <div className="max-sm:w-full">
              <div className="flex justify-center items-center gap-5">
                <img className="w-5" src="/landing/star1.png" alt="" />
                <img className="w-5" src="/landing/star2.png" alt="" />
              </div>
              <h1 className="text-5xl md:text-6xl max-sm:text-2xl mb-6 mt-6 mx-auto">
                Power your business <br /> with Neecop
              </h1>
              <p className="text-gray-600 text-lg w-[500px] max-sm:w-full text-center">
                Unlock growth opportunities with our intelligent ecosystem.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-sm:gap-5 relative">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="space-y-16 max-sm:flex max-sm:gap-5"
            >
              <Feature
                imageSrc="/landing/star.png"
                title="Data-Driven Decision Making"
                description="Track key business metrics in real-time."
              />
              <Feature
                imageSrc="/landing/cube.png"
                title="Simplified Processes"
                description="User-friendly solutions for effortless business management."
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative flex justify-center"
            >
              <img
                src="/landing/powerImage.png"
                alt="Dashboard preview"
                className="w-[800px] md:w-[1200px] h-auto rounded-xl shadow-[5px_0px_1000px_2px_rgba(37,99,235,0.5)]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="space-y-16 max-sm:mt-10 mx-20 max-sm:mx-0 max-sm:flex max-sm:gap-5"
            >
              <Feature
                imageSrc="/landing/plate.png"
                title="Effective Communication"
                description="Integrated chat and networking features."
              />
              <Feature
                imageSrc="/landing/cylinder.png"
                title="Customizable Solutions"
                description="Adapt tools based on your unique business needs."
              />
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function Feature({
  imageSrc,
  title,
  description,
}: {
  imageSrc: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="flex flex-col w-[250px]"
    >
      <div className="h-10 flex mb-4">
        <img src={imageSrc} alt={title} className="w-12 h-12" />
      </div>
      <h3 className="text-[20px] text-blue-600 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </motion.div>
  );
}

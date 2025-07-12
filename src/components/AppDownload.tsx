'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

const AppDownload = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden" id="download">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              SmartSecure On The Go
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Manage your society from anywhere with our secure mobile app.
              Stay connected with your community, approve visitors, and track
              maintenance requests - all from your smartphone.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* App Store Button */}
              <a
                href="#"
                className="flex items-center justify-center space-x-2 bg-white text-blue-900 px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors duration-200"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </a>

              {/* Play Store Button */}
              <a
                href="#"
                className="flex items-center justify-center space-x-2 bg-white text-blue-900 px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors duration-200"
              >
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="text-lg font-semibold">Google Play</div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px] hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent rounded-3xl transform rotate-6">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl transform -rotate-3 shadow-2xl">
                {/* Phone Screen Content */}
                <div className="relative h-full w-full overflow-hidden rounded-3xl">
                  {/* Add phone mockup or app screenshots here */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppDownload;
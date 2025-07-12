'use client';

import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

const features = [
  {
    icon: '/visitor_gate.svg',
    step: 1,
    heading: 'Effortless Resident Onboarding',
    description:
      'Digitally register residents, map units, manage contacts, and more — all from a secure and intuitive platform that saves time and scales effortlessly.',
    image: '/onboarding.svg',
  },
  {
    icon: '/visitor_gate.svg',
    step: 2,
    heading: 'Instant Guest Approvals',
    description:
      'Get real-time visitor notifications, approve access with a tap, and maintain detailed logs. Seamless, secure, and user-friendly.',
    image: '/approveVector.svg',
  },
  {
    icon: '/visitor_gate.svg',
    step: 3,
    heading: 'Automated Billing & Payments',
    description:
      'Send bills, reminders, and receive payments — all without manual follow-up. A centralized dashboard for financial control and clarity.',
    image: '/payments.svg',
  },
  {
    icon: '/visitor_gate.svg',
    step: 4,
    heading: 'Community Connect',
    description:
      'Keep your community engaged with polls, announcements, event calendars, and resident forums — all from one place.',
    image: '/connect.svg',
  },
];

export default function FeatureSection() {
  const controls = features.map(() => useAnimation());
  const refs = features.map(() => useRef(null));
  const inView = refs.map((ref) => useInView(ref, { once: true, margin: '-20%' }));

  useEffect(() => {
    inView.forEach((isVisible, index) => {
      if (isVisible) controls[index].start('visible');
    });
  }, [inView, controls]);

  return (
    <section className="relative py-8 md:py-14 bg-white overflow-x-hidden min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 1,
            type: "spring",
            bounce: 0.4
          }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight px-2">
            Empowering Residences with{' '}
            <motion.span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Intelligent Access
            </motion.span>
          </h2>
          <p className="mt-4 md:mt-5 text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
           Built to simplify your society's operations — secure, scalable, and easy to use.
          </p>
        </motion.div>

        {/* Feature Cards in Screenshot Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              ref={refs[index]}
              variants={{
                hidden: { opacity: 0, y: 60, scale: 0.95 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { 
                    duration: 0.8, 
                    delay: index * 0.2,
                    type: "spring",
                    bounce: 0.35
                  },
                },
              }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
              initial="hidden"
              animate={controls[index]}
              className="rounded-xl md:rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between p-4 md:p-5 transition-all duration-300 hover:bg-white hover:border-indigo-300"
              style={{ minHeight: '380px', height: 'auto' }}
            >
              {/* Top Section: Step + Heading + Description */}
              <div>
                <motion.div 
                  className="text-sm font-semibold text-black mb-2 md:mb-3"
                  whileHover={{ 
                    scale: 1.15, 
                    transformOrigin: "0%",
                    color: '#4F46E5'
                  }}
                >
                  {`❶`.slice(0, 1) + feature.step}
                </motion.div>

                <motion.h3 
                  className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3"
                  whileHover={{ 
                    color: '#4F46E5', 
                    x: 8,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                >
                  {feature.heading}
                </motion.h3>

                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bottom Section: Image */}
              <motion.div 
                className="mt-4 md:mt-5 h-[120px] md:h-[160px] flex items-center justify-center"
                whileHover={{ 
                  scale: 1.05,
                  transition: { 
                    type: "spring",
                    stiffness: 300
                  }
                }}
              >
                <Image
                  src={feature.image}
                  alt={feature.heading}
                  width={512}
                  height={300}
                  className="w-full h-full rounded-lg md:rounded-xl object-contain transition-all duration-300 hover:shadow-lg"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

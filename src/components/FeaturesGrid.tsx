'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ReactElement, useState } from 'react';

interface Feature {
  title: string;
  description: string;
  icon: ReactElement;
}

const features: Feature[] = [
  {
    title: 'Smart Visitor Management',
    description: 'Streamlined visitor entry with QR codes, pre-approvals, and real-time notifications to residents.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2..." />
      </svg>
    ),
  },
  {
    title: 'Digital Notice Board',
    description: 'Stay updated with announcements, events, and community notifications.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5..." />
      </svg>
    ),
  },
  {
    title: 'Staff Management',
    description: 'Track attendance and access for domestic help and staff digitally.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5..." />
      </svg>
    ),
  },
  {
    title: 'Emergency Services',
    description: 'One-click SOS alerts to guards and neighbors in emergencies.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5..." />
      </svg>
    ),
  },
  {
    title: 'Vehicle Management',
    description: 'Automated vehicle tracking with digital permits and guest access.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6..." />
      </svg>
    ),
  },
  {
    title: 'Maintenance Requests',
    description: 'Easily raise and monitor maintenance tasks with vendor updates.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317..." />
      </svg>
    ),
  },
  {
    title: 'Community Events',
    description: 'Participate in gatherings, festivals, and social activities.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3..." />
      </svg>
    ),
  },
  {
    title: 'Utility Management',
    description: 'Manage bills, payments, and utilities in one dashboard.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3..." />
      </svg>
    ),
  },
  {
    title: 'Security Monitoring',
    description: 'Live surveillance and alerts for enhanced security.',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4..." />
      </svg>
    ),
  },
];

export default function CommunityFeatures() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [showAll, setShowAll] = useState(false);
  const visibleFeatures = showAll ? features : features.slice(0, 6);

  return (
    <section id="smart-features" className="py-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm uppercase font-semibold text-indigo-600 tracking-wide mb-1">
            Platform Capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
            Smart Community Features
          </h2>
          <p className="mt-3 text-base text-gray-600 max-w-xl mx-auto">
            A complete toolkit for managing modern gated communities.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {visibleFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5 } },
              }}
              whileHover={{
                scale: 1.03,
                transition: { duration: 0.2 },
              }}
              className="relative p-5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 hover:border-indigo-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-block px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition"
          >
            {showAll ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>
    </section>
  );
}

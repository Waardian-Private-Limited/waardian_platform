'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Basic',
    price: '₹999',
    description: 'Perfect for small communities',
    features: [
      'Up to 50 units',
      'Visitor management',
      'Staff attendance',
      'Basic reporting',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    price: '₹1,999',
    description: 'Ideal for medium-sized societies',
    features: [
      'Up to 200 units',
      'All Basic features',
      'Facility booking',
      'Maintenance billing',
      'Chat support',
      'Advanced analytics',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large communities',
    features: [
      'Unlimited units',
      'All Pro features',
      'Custom integrations',
      'Dedicated support',
      'API access',
      'White-label options',
    ],
  },
];

const PricingSection = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section className="py-20 bg-gray-50" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your community
          </p>
        </div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`rounded-2xl p-8 ${tier.highlighted
                ? 'bg-blue-600 text-white transform scale-105 shadow-xl'
                : 'bg-white text-gray-900 shadow-lg'
                }`}
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className={`${tier.highlighted ? 'text-blue-100' : 'text-gray-600'} mb-4`}>
                  {tier.description}
                </p>
                <div className="text-4xl font-bold mb-8">{tier.price}
                  <span className="text-lg font-normal">/month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center justify-center">
                      <svg
                        className={`w-5 h-5 mr-2 ${tier.highlighted ? 'text-blue-200' : 'text-blue-600'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-transform transform hover:scale-105 ${tier.highlighted
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-600 text-white'
                    }`}
                >
                  Choose {tier.name}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
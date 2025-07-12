'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How secure is SmartSecure for managing visitor data?',
    answer: 'SmartSecure employs bank-grade encryption for all data and follows strict privacy guidelines. We use secure cloud infrastructure and regular security audits to ensure your community\'s data remains protected.',
  },
  {
    question: 'Can residents approve visitors through the mobile app?',
    answer: 'Yes! Residents can approve visitors instantly through our mobile app. They receive real-time notifications when a visitor arrives and can generate QR codes or OTPs for pre-approved entry.',
  },
  {
    question: 'How does the maintenance billing system work?',
    answer: 'Our maintenance billing system automates the entire process - from bill generation to payment collection. It supports multiple payment methods, sends automated reminders, and generates detailed reports for accounting.',
  },
  {
    question: 'Is there a limit on the number of users per society?',
    answer: 'No, there\'s no limit on the number of resident users. However, the number of admin users varies based on your subscription plan. The Enterprise plan offers unlimited admin users.',
  },
  {
    question: 'Do you provide training for society staff?',
    answer: 'Yes, we provide comprehensive training for society staff and administrators. This includes online tutorials, documentation, and live training sessions for Enterprise customers.',
  },
  {
    question: 'Can we migrate data from our existing system?',
    answer: 'Yes, we offer data migration services to help you transition smoothly from your existing system. Our team will work with you to ensure all important data is transferred securely.',
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 bg-gray-50" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about SmartSecure
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{ backgroundColor: openIndex === index ? 'rgb(255, 255, 255)' : 'rgb(249, 250, 251)' }}
              className="rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Review {
  id: number;
  name: string;
  role: string;
  society: string;
  image: string;
  rating: number;
  text: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    role: 'Society President',
    society: 'Green Valley Apartments',
    image: '/avatars/avatar1.svg',
    rating: 5,
    text: 'SmartSecure has transformed how we manage our society. The visitor management system is particularly impressive.',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    role: 'Resident',
    society: 'Sunshine Towers',
    image: '/avatars/avatar2.svg',
    rating: 5,
    text: 'The app is very user-friendly and has made community living so much more convenient. Highly recommended!',
  },
  {
    id: 3,
    name: 'Amit Patel',
    role: 'Secretary',
    society: 'Royal Heights',
    image: '/avatars/avatar3.svg',
    rating: 5,
    text: 'Excellent platform for managing society affairs. The maintenance billing feature has saved us countless hours.',
  },
];

const ClientReviews = () => {
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-white" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Communities</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what our users have to say about SmartSecure
          </p>
        </div>

        {/* Client Logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center mb-16">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="flex justify-center">
              <div className="w-32 h-12 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Testimonials Carousel */}
        <div className="relative h-[400px] overflow-hidden">
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentReview}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <div className="bg-gray-50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto shadow-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 relative mb-6">
                    <Image
                      src={reviews[currentReview].image}
                      alt={reviews[currentReview].name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>

                  {/* Star Rating */}
                  <div className="flex space-x-1 mb-6">
                    {[...Array(reviews[currentReview].rating)].map((_, i) => (
                      <svg
                        key={i}
                        className="w-6 h-6 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-xl text-gray-600 mb-6">"{reviews[currentReview].text}"</p>

                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{reviews[currentReview].name}</h4>
                    <p className="text-gray-600">{reviews[currentReview].role}</p>
                    <p className="text-blue-600">{reviews[currentReview].society}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-2 mt-8">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${index === currentReview ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientReviews;
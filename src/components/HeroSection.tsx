"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import animationData from "@/animations/landingAnimation.json";

export default function Hero() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(0.5);
    }
  }, []);

  return (
    <section className="relative bg-black text-white w-full overflow-hidden">
      {/* Glowing Background Blur (Both blue now) */}
      <div className="absolute top-[-50px] sm:top-[-100px] left-[-75px] sm:left-[-150px] w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-blue-500 rounded-full blur-3xl opacity-30 z-0 animate-pulse" />
      <div className="absolute bottom-[-50px] sm:bottom-[-100px] right-[-75px] sm:right-[-150px] w-[150px] sm:w-[300px] h-[150px] sm:h-[300px] bg-blue-500 rounded-full blur-2xl opacity-30 z-0 animate-pulse" />

      {/* Main Content Grid */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 items-center gap-8 sm:gap-12 min-h-[80vh] sm:min-h-[90vh]">
        {/* Left Content */}
        <motion.div
          className="text-left"
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 tracking-tight">
            Modern living. <br />
            Secure communities. <br />
            Simplified.
          </h1>

          <motion.p
            className="text-gray-300 mb-6 max-w-md text-sm sm:text-base leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            All-in-one platform for resident, visitor, staff, and facility
            management. Streamline security, payments, bookings, and
            communication for any gated community.
          </motion.p>

          <motion.div
            className="flex gap-3 sm:gap-4 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-md text-xs sm:text-sm font-medium shadow-lg"
            >
              Book demo
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border border-white text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-md text-xs sm:text-sm font-medium"
            >
              Explore features
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Content with Lottie Animation */}
        <motion.div
          className="flex justify-end mt-8 md:mt-0"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div 
            className="relative w-full max-w-[280px] xs:max-w-sm sm:max-w-md lg:max-w-lg h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-visible"
            onMouseEnter={() => lottieRef.current?.play()}
            onMouseLeave={() => lottieRef.current?.stop()}
          >
            <Lottie 
              lottieRef={lottieRef}
              animationData={animationData}
              loop={false}
              autoPlay={false}
              className="w-[170%] h-[170%] -translate-x-[35%] -translate-y-[30%] will-change-transform"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon, 
  ShoppingCartIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const scrollToDemo = (e: React.MouseEvent) => {
  e.preventDefault();
  const demoSection = document.getElementById('demo');
  if (demoSection) {
    demoSection.scrollIntoView({ behavior: 'smooth' });
  }
};

export default function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 via-white/50 to-purple-50/90 dark:from-blue-950/50 dark:via-gray-900/50 dark:to-purple-950/50" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-size animate-gradient-x bg-gradient-to-r from-transparent via-blue-200/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-size animate-gradient-y bg-gradient-to-b from-transparent via-purple-200/30 to-transparent" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-1.5">
              <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm px-5 py-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300">
                  DoveText
                </span>
                <div className="flex items-center mt-0.5">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Powered by Advanced AI
                  </span>
                  <div className="w-4 h-4 text-blue-500 flex-shrink-0 ml-1.5" aria-hidden="true">
                    <SparklesIcon className="w-full h-full"/>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mt-6"
          >
            Smart Notifications
            <br />
            <span className="text-blue-600 dark:text-blue-400">Reimagined</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-300 mt-12 mb-16 leading-relaxed"
          >
            <span className="block text-gray-900 dark:text-white font-medium">
              Your digital life, curated with intelligence
            </span>
            <span className="block text-blue-600/90 dark:text-blue-400/90 font-medium mt-3">
              Stay informed, not overwhelmed
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <a
              href="#waitlist"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3"
            >
              <div className="flex items-center space-x-2">
                <span className="whitespace-nowrap">Join the Waitlist</span>
              </div>
            </a>
            <a
              href="#features"
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              Learn More
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-8"
          >
            <a
              href="#demo"
              onClick={scrollToDemo}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              <span>Watch Dove Text in Action</span>
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </a>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

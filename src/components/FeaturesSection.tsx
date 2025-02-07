'use client';

import { motion } from 'framer-motion';
import { 
  BellIcon, 
  ChatBubbleBottomCenterTextIcon,
  CalendarIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    title: "Smart Notifications",
    description: "AI-powered notifications that understand context and prioritize what matters most to you.",
    icon: BellIcon,
  },
  {
    title: "Natural Language",
    description: "Set up notifications using everyday language - no complex rules or settings needed.",
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    title: "Intelligent Scheduling",
    description: "Let AI optimize your notification timing based on your preferences and habits.",
    icon: CalendarIcon,
  },
  {
    title: "AI-Powered Insights",
    description: "Get smart suggestions and insights based on your notification patterns.",
    icon: SparklesIcon,
  },
  {
    title: "Privacy First",
    description: "Your data is encrypted and protected. You're in control of what you share.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Smart Integration",
    description: "Seamlessly connects with your favorite apps and services.",
    icon: CpuChipIcon,
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function FeaturesSection() {
  return (
    <motion.section
      id="features"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={itemVariants}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to stay informed without the noise
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="relative p-8 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:shadow-lg transition-all duration-200"
            >
              <div className="absolute -top-4 left-8">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

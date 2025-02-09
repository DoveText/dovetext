import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  BellIcon,
  ShoppingCartIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface NotificationProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  type: 'price' | 'email' | 'social' | 'automation' | 'assistant';
}

type DialogType = 'assist' | 'watch' | 'filter' | 'automate';

type ScenarioState = {
  icon: JSX.Element;
  title: string;
  description: string;
  action: string;
  color: string;
  time: string;
};

type DemoScenario = {
  setup: ScenarioState;
  result: ScenarioState;
};

type DemoScenarios = {
  [K in DialogType]: DemoScenario;
};

type DemoItem = {
  icon: JSX.Element;
  title: string;
  scenario: string;
  description: string;
  dialog: DialogType;
};

const demoItems: DemoItem[] = [
  {
    icon: <CalendarIcon className="w-12 h-12" />,
    title: "Personal Assistant",
    scenario: "Set reminders and manage your schedule effortlessly",
    description: "Your AI companion that understands and acts on your requests instantly",
    dialog: "assist"
  },
  {
    icon: <ShoppingCartIcon className="w-12 h-12" />,
    title: "Smarter Watching",
    scenario: "Never miss a deal on items you want to buy",
    description: "Stay ahead with real-time updates on what matters most to you",
    dialog: "watch"
  },
  {
    icon: <EnvelopeIcon className="w-12 h-12" />,
    title: "Intelligent Filtering",
    scenario: "Focus on what matters in your inbox",
    description: "Cut through the noise and discover what truly deserves your attention",
    dialog: "filter"
  },
  {
    icon: <ArrowPathIcon className="w-12 h-12" />,
    title: "Task Automation",
    scenario: "Let AI handle your repetitive tasks",
    description: "Free yourself from routine work and focus on what humans do best",
    dialog: "automate"
  }
];

const demoScenarios: DemoScenarios = {
  assist: {
    setup: {
      icon: <CalendarIcon className="w-6 h-6 text-blue-600" />,
      title: "Setting Up Reminder",
      description: "Remind me about my dentist appointment this Friday at 2:30 PM",
      action: "Processing request...",
      color: "blue",
      time: "Just now"
    },
    result: {
      icon: <CheckCircleIcon className="w-6 h-6 text-green-600" />,
      title: "Reminder Set Successfully",
      description: "Dentist appointment reminder set for Friday, Feb 9 at 2:30 PM",
      action: "View in Calendar →",
      color: "green",
      time: "Just now"
    }
  },
  watch: {
    setup: {
      icon: <ShoppingCartIcon className="w-6 h-6 text-blue-600" />,
      title: "PS5 Price Watch Setup",
      description: "Tracking price drops for PS5 console",
      action: "Setting up price watch...",
      color: "blue",
      time: "1 hour ago"
    },
    result: {
      icon: <ShoppingCartIcon className="w-6 h-6 text-green-600" />,
      title: "PS5 Price Drop Alert",
      description: "PS5 console is now 10% off!",
      action: "View deal →",
      color: "green",
      time: "Just now"
    }
  },
  filter: {
    setup: {
      icon: <EnvelopeIcon className="w-6 h-6 text-blue-600" />,
      title: "Email Watch Setup",
      description: "Tracking important emails from clients",
      action: "Setting up email watch...",
      color: "blue",
      time: "1 hour ago"
    },
    result: {
      icon: <EnvelopeIcon className="w-6 h-6 text-green-600" />,
      title: "Important Email from Client",
      description: "Client meeting rescheduled to 3 PM",
      action: "View email →",
      color: "green",
      time: "Just now"
    }
  },
  automate: {
    setup: {
      icon: <ArrowPathIcon className="w-6 h-6 text-blue-600" />,
      title: "Automation Setup",
      description: "Setting up weekly report automation",
      action: "Setting up automation...",
      color: "blue",
      time: "1 hour ago"
    },
    result: {
      icon: <ArrowPathIcon className="w-6 h-6 text-green-600" />,
      title: "Automation Complete",
      description: "Weekly report generated and sent",
      action: "View report →",
      color: "green",
      time: "Just now"
    }
  }
};

export default function DemoSection() {
  const [queueIndex, setQueueIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(true);
  const [currentDemo, setCurrentDemo] = useState<string | null>(null);
  const [demoSetup, setDemoSetup] = useState(true);

  // Queue timing for carousel
  useEffect(() => {
    const interval = setInterval(() => {
      // Start transition
      setIsTransitioning(true);
      
      // After transition completes, update queue and reset transition
      setTimeout(() => {
        setIsTransitioning(false);
        setQueueIndex(prev => (prev + 1) % demoItems.length);
      }, 700); // Match transition duration
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Get current visible items from the infinite queue
  const getVisibleItems = () => {
    const queue = [...demoItems, ...demoItems];
    return [
      queue[queueIndex % demoItems.length],
      queue[(queueIndex + 1) % demoItems.length],
      queue[(queueIndex + 2) % demoItems.length],
      queue[(queueIndex + 3) % demoItems.length],
    ];
  };

  // Get current highlighted item
  const getHighlightedItem = () => {
    return demoItems[(queueIndex + 1) % demoItems.length];
  };

  // Get current dialog content
  const getCurrentDialog = () => {
    const item = getHighlightedItem();
    if (!item) return demoScenarios.assist.setup;
    return demoSetup ? demoScenarios[item.dialog].setup : demoScenarios[item.dialog].result;
  };

  // Demo timer effect - starts/stops based on highlighted item
  useEffect(() => {
    const currentItem = demoItems[queueIndex];
    
    // Reset state for new demo
    setCurrentDemo(currentItem.dialog);
    setDemoSetup(true);
    setDialogVisible(true);
    
    // Schedule switch to result after 3s
    const timer = setTimeout(() => {
      setDialogVisible(false);
      setTimeout(() => {
        setDemoSetup(false);  // Switch to result
        setDialogVisible(true);
      }, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [queueIndex]);

  return (
    <section id="demo" className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to stay on top
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">
            From tracking prices to managing your schedule, Dove helps you stay organized and never miss what&apos;s important.
          </p>
        </div>

        {/* Notification Demo */}
        <div className="relative mt-8 mb-12">
          <AnimatePresence mode="wait">
            {dialogVisible && currentDemo && (
              <motion.div
                key={`${currentDemo}-${demoSetup}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: dialogVisible ? 1 : 0, y: dialogVisible ? 0 : 20 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 p-3 rounded-xl bg-${getCurrentDialog().color}-100 dark:bg-${getCurrentDialog().color}-900/30`}>
                      {getCurrentDialog().icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {getCurrentDialog().title}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {getCurrentDialog().time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getCurrentDialog().description}
                      </p>
                      <div className="mt-2">
                        <span className={`text-sm font-medium text-${getCurrentDialog().color}-600 hover:text-${getCurrentDialog().color}-500 cursor-pointer`}>
                          {getCurrentDialog().action}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Carousel */}
        <div className="relative mt-16">
          <div className="max-w-5xl mx-auto overflow-hidden">
            <div 
              key={queueIndex}
              className="flex gap-8 transition-all duration-700 ease-in-out"
              style={{ 
                transform: `translateX(-${isTransitioning ? 25 : 0}%)`,
                width: '133.33%'  // Space for 4 items but show 3
              }}
            >
              {getVisibleItems().map((item, index) => (
                <div 
                  key={`${item.title}-${queueIndex}-${index}`}
                  className={`
                    w-1/4 flex-shrink-0 text-center p-6 
                    transition-all duration-700 ease-in-out
                    ${(isTransitioning ? index === 2 : index === 1) ? 'bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-lg scale-110 -translate-y-4' : 'scale-100 translate-y-0'}
                    ${(isTransitioning ? index === 2 : index === 1) ? 'opacity-100' : 'opacity-50'}
                  `}
                >
                  <div className="mx-auto text-blue-500 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [customUseCase, setCustomUseCase] = useState('');
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'checking' | 'exists' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const useCases = [
    "Manage Personal Schedules",
    "Monitor Social Media Updates",
    "Track Price Changes",
    "Follow News Topics",
    "Get Weather Alerts",
    "Track Package Deliveries",
  ];

  // Debounced email check
  useEffect(() => {
    if (!email) return;
    
    const timer = setTimeout(() => {
      checkEmail(email);
    }, 500); // Wait 500ms after last keystroke

    return () => clearTimeout(timer);
  }, [email]);

  const handleUseCaseToggle = (useCase: string) => {
    setSelectedUseCases(prev => 
      prev.includes(useCase)
        ? prev.filter(item => item !== useCase)
        : [...prev, useCase]
    );
  };

  const checkEmail = async (email: string) => {
    try {
      setStatus('checking');
      const response = await fetch('/api/v1/waitlist/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.exists) {
        setStatus('exists');
        setMessage('You are already in the waitlist!');
      } else {
        setStatus('idle');
        setMessage('');
      }
    } catch (error) {
      setStatus('error');
      if (error instanceof SyntaxError) {
        setMessage('Server error: Invalid response format');
      } else if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Something went wrong. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setStatus('checking');
      const response = await fetch('/api/v1/waitlist/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          useCases: selectedUseCases,
          customUseCase,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage(data.updated 
          ? 'Your preferences have been updated!' 
          : 'Thanks for joining our waitlist!');
        setSelectedUseCases([]);
        setCustomUseCase('');
        setShowThankYou(true);
        setIsUpdate(data.updated);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <motion.section
      id="waitlist"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 -z-10" />
      
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {showThankYou ? (isUpdate ? "Preferences Updated!" : "Thank You!") : "Be the First to Experience"}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {showThankYou ? 
              (isUpdate ? 
                "We've saved your updated preferences." : 
                "We'll keep you updated on all the exciting developments."
              ) : "Join our waitlist and get early access to the future of notifications"}
          </p>
        </motion.div>

        {showThankYou ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {isUpdate ? "Your preferences updated!" : "You're on the List!"}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {isUpdate ? (
                    <>
                      Thank you, {email}!<br/>
                      We&apos;ve received your updates and will be working on them. We will keep you updated on the progress and inform you when your desired features are ready.
                    </>
                  ) : (
                    <>
                      Thank you, {email}!<br/>
                      We&apos;re excited to have you join us on this journey. We are working hard to provide you with the best experience possible and we will keep you updated on our progress.
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowThankYou(false);
                  setIsUpdate(false);
                  setEmail('');
                  setSelectedUseCases([]);
                  setCustomUseCase('');
                  setStatus('idle');
                  setMessage('');
                }}
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-medium"
              >
                ← Back to form
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email address
                </label>
                <div className="mt-2 relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full py-3 px-4 rounded-lg border-2 ${
                      status === 'exists' ? 'border-yellow-500 dark:border-yellow-600' :
                      status === 'error' ? 'border-red-500 dark:border-red-600' :
                      status === 'success' ? 'border-green-500 dark:border-green-600' :
                      'border-gray-300 dark:border-gray-600'
                    } shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800/50 text-base`}
                    placeholder="you@example.com"
                    required
                    disabled={status === 'checking'}
                  />
                  <div className="h-6 mt-2">
                    {message && (
                      <p className={`text-sm ${
                        status === 'exists' ? 'text-yellow-600 dark:text-yellow-400' :
                        status === 'error' ? 'text-red-600 dark:text-red-400' :
                        status === 'success' ? 'text-green-600 dark:text-green-400' :
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  What would you like to be notified about?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {useCases.map((useCase) => (
                    <div key={useCase} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={useCase}
                          type="checkbox"
                          checked={selectedUseCases.includes(useCase)}
                          onChange={() => handleUseCaseToggle(useCase)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                          disabled={status === 'checking'}
                        />
                      </div>
                      <label
                        htmlFor={useCase}
                        className="ml-3 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {useCase}
                      </label>
                    </div>
                  ))}
                </div>
                  
                <div className="mt-8">
                  <label
                    htmlFor="custom"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Custom use case or feature requests (optional)
                  </label>
                  <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm">
                    <textarea
                      id="custom"
                      rows={4}
                      value={customUseCase}
                      onChange={(e) => setCustomUseCase(e.target.value)}
                      className="block w-full border-0 bg-transparent p-0 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:ring-0"
                      placeholder="Tell us what else you'd like to track or be notified about..."
                      disabled={status === 'checking'}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={status === 'checking'}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    status === 'checking' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {status === 'checking' ? 'Checking...' : 
                   status === 'exists' ? 'Update Preferences' : 
                   'Join Waitlist'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              By joining, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Privacy Policy
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

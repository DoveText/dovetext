import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link 
            href="/privacy" 
            className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
          >
            Privacy Policy
          </Link>
          <Link 
            href="/terms" 
            className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
          >
            Terms of Service
          </Link>
        </div>
        <div className="mt-4 md:mt-0 md:order-1">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} DoveText. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

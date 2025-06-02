'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, ChevronDownIcon, CalendarIcon, SparklesIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PersonalNavigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Function to handle navigation with loading indicator
  const handleNavigation = (href: string, e: React.MouseEvent, closeMenu?: () => void) => {
    e.preventDefault();
    
    // Check if we're already on this page
    if (window.location.pathname === href) {
      // If we're already on this page, just close the menu if provided
      if (closeMenu) closeMenu();
      return;
    }
    
    // Dispatch a custom event to signal route change start
    document.dispatchEvent(new CustomEvent('routeChangeStart'));
    
    // Close the menu if provided
    if (closeMenu) closeMenu();
    
    // Navigate to the new page
    setTimeout(() => {
      router.push(href);
    }, 50); // Small delay to ensure the loading indicator appears
  };

  const handleSignOut = async () => {
    try {
      await logout();
    }
    catch (error) {
      console.error('Error signing out:', error);
    }
    finally {
      // Redirect to home page after successful logout
      window.location.href = '/';
    }
  };

  return (
    <nav className="bg-white shadow-sm relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center">
              <Image
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.svg`}
                alt="DoveText Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="ml-2 text-xl font-semibold text-gray-900">DoveText</span>
            </Link>
          </div>

          {/* Main Navigation */}
          {user && (
            <div className="hidden md:flex items-center ml-10 space-x-10">
              <Link
                href="/dashboard"
                onClick={(e) => handleNavigation('/dashboard', e)}
                className="text-sm font-medium text-gray-900 hover:text-gray-700 flex items-center px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link
                href="/schedule"
                onClick={(e) => handleNavigation('/schedule', e)}
                className="text-sm font-medium text-gray-900 hover:text-gray-700 flex items-center px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                My Schedule
              </Link>
              <Link
                href="/tasks"
                onClick={(e) => handleNavigation('/tasks', e)}
                className="text-sm font-medium text-gray-900 hover:text-gray-700 flex items-center px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                AI Automations
              </Link>
            </div>
          )}

          {/* Right Side Navigation */}
          <div className="flex items-center space-x-6">
            {!user && (
              <Link
                href="/pricing"
                className="text-sm font-medium text-gray-900 hover:text-gray-700"
              >
                Pricing
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Notification Menu */}
                <Menu as="div" className="relative z-50">
                  <Menu.Button className="flex items-center text-gray-700 hover:text-gray-900">
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active, close }) => (
                            <Link
                              href="/notifications/delivery-methods"
                              onClick={(e) => handleNavigation('/notifications/delivery-methods', e, close)}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Delivery Methods
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active, close }) => (
                            <Link
                              href="/notifications/delivery-channels"
                              onClick={(e) => handleNavigation('/notifications/delivery-channels', e, close)}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Delivery Channels
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active, close }) => (
                            <Link
                              href="/notifications/escalation-chains"
                              onClick={(e) => handleNavigation('/notifications/escalation-chains', e, close)}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Escalation Chains
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active, close }) => (
                            <Link
                              href="/notifications/delivery-rules"
                              onClick={(e) => handleNavigation('/notifications/delivery-rules', e, close)}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Delivery Rules
                            </Link>
                          )}
                        </Menu.Item>                        
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>

                {/* User Menu */}
                <Menu as="div" className="relative z-50">
                  <Menu.Button className="flex items-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={user.photoURL || `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/default-avatar.png`}
                        alt="User avatar"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          const img = e.target as HTMLImageElement;
                          img.src = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/default-avatar.png`;
                        }}
                      />
                    </div>
                    <ChevronDownIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active, close }) => (
                            <Link
                              href="/user/profile"
                              onClick={(e) => handleNavigation('/user/profile', e, close)}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active, close }) => (
                            <Link
                              href="/user/settings"
                              onClick={(e) => handleNavigation('/user/settings', e, close)}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Settings
                            </Link>
                          )}
                        </Menu.Item>
                        {/* Admin Tools menu item - only visible for admin users */}
                        {user.settings?.role === 'admin' && (
                          <Menu.Item>
                            {({ active, close }) => (
                              <Link
                                href="/admin-tools"
                                onClick={(e) => handleNavigation('/admin-tools', e, close)}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Admin Tools
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSignOut();
                              }}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block w-full text-left px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

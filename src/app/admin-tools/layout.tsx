'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  ChevronDownIcon, 
  Cog6ToothIcon, 
  UserGroupIcon, 
  BellIcon, 
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import LoadingIndicator from '@/components/common/LoadingIndicator';

// Define admin tool types
interface AdminTool {
  id: string;
  name: string;
  description: string;
  path: string;
  icon?: React.ReactNode;
}

// Helper function for conditional class names
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AdminToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication and redirect if not authenticated
    if (!loading) {
      if (!user) {
        router.push('/signin?redirect=/admin-tools');
      } else if (user.settings?.role !== 'admin') {
        // Redirect non-admin users
        router.push('/dashboard');
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading, router]);

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 shadow-lg rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Define available admin tools
  const adminTools: AdminTool[] = [
    {
      id: 'home',
      name: 'Admin Dashboard',
      description: 'Overview of all admin tools',
      path: '/admin-tools',
      icon: <HomeIcon className="h-5 w-5 text-gray-500" />
    },
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Configure global system settings and parameters',
      path: '/admin-tools/settings',
      icon: <Cog6ToothIcon className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'users',
      name: 'User Management',
      description: 'Manage users, roles, and permissions',
      path: '/admin-tools/users',
      icon: <UserGroupIcon className="h-5 w-5 text-green-500" />
    },
    {
      id: 'notifications',
      name: 'Notification Templates',
      description: 'Configure system notification templates',
      path: '/admin-tools/notifications',
      icon: <BellIcon className="h-5 w-5 text-yellow-500" />
    },
    {
      id: 'scheduler',
      name: 'Task Scheduler',
      description: 'Configure and monitor scheduled system tasks',
      path: '/admin-tools/scheduler',
      icon: <ClockIcon className="h-5 w-5 text-purple-500" />
    },
    {
      id: 'analytics',
      name: 'System Analytics',
      description: 'View system performance and usage statistics',
      path: '/admin-tools/analytics',
      icon: <ChartBarIcon className="h-5 w-5 text-red-500" />
    },
    {
      id: 'security',
      name: 'Security Settings',
      description: 'Configure security policies and audit logs',
      path: '/admin-tools/security',
      icon: <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />
    },
    {
      id: 'prompts',
      name: 'LLM Prompts Manager',
      description: 'Create, edit, and delete LLM prompts',
      path: '/admin-tools/prompts',
    },
    {
      id: 'notification-test',
      name: 'Notification Test',
      description: 'Test notification delivery methods',
      path: '/admin-tools/test/notification',
    },
    {
      id: 'test-tools',
      name: 'All Test Tools',
      description: 'Access all testing tools',
      path: '/admin-tools/test',
    },
  ];

  const currentTool = adminTools.find(tool => 
    pathname === tool.path || pathname.startsWith(`${tool.path}/`)
  ) || adminTools[0];

  // Determine if we're on the main dashboard page
  const isMainDashboard = pathname === '/admin-tools';

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Use the shared LoadingIndicator component */}
      <LoadingIndicator />
      
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link 
              href="/admin-tools" 
              className="text-xl font-bold text-gray-800 mr-4 hover:text-blue-600 transition-colors"
              onClick={() => document.dispatchEvent(new Event('routeChangeStart'))}
            >
              Admin Tools
            </Link>
            
            {/* Admin Tools Dropdown */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  {currentTool.name}
                  <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute left-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    {adminTools.map((tool) => (
                      <Menu.Item key={tool.id}>
                        {({ active }) => (
                          <Link
                            href={tool.path}
                            className={classNames(
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'block px-4 py-2 text-sm'
                            )}
                            onClick={() => document.dispatchEvent(new Event('routeChangeStart'))}
                          >
                            <div className="flex items-center">
                              {tool.icon && <span className="mr-2">{tool.icon}</span>}
                              <div>
                                <p className="font-medium">{tool.name}</p>
                                <p className="text-xs text-gray-500">{tool.description}</p>
                              </div>
                            </div>
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Logged in as {user?.email}
            </span>
            <a 
              href="/" 
              className="text-blue-600 hover:text-blue-800 text-sm"
              onClick={(e) => {
                e.preventDefault();
                document.dispatchEvent(new Event('routeChangeStart'));
                router.push('/');
              }}
            >
              Back to Dashboard
            </a>
          </div>
        </div>
        <div className="container mx-auto px-4 py-2 border-t border-gray-200">
          <nav>
            <ul className="flex space-x-6">
              <li>
                <NavLink href="/admin-tools" exactPath={true}>Dashboard</NavLink>
              </li>
              <li>
                <NavLink href="/admin-tools/settings">Settings</NavLink>
              </li>
              <li>
                <NavLink href="/admin-tools/users">Users</NavLink>
              </li>
              <li>
                <NavLink href="/admin-tools/prompts">Prompts</NavLink>
              </li>
              <li>
                <NavLink href="/admin-tools/test">Test Tools</NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      {/* Apply container styles only to non-dashboard pages */}
      {isMainDashboard ? (
        <main>{children}</main>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
}

function NavLink({ href, children, exactPath = false }: { href: string; children: React.ReactNode; exactPath?: boolean }) {
  const pathname = usePathname() || '';
  const isActive = exactPath 
    ? pathname === href 
    : (pathname === href || pathname.startsWith(`${href}/`)) && href !== '/admin-tools';
  
  return (
    <Link 
      href={href}
      className={`text-sm font-medium py-2 border-b-2 ${isActive 
        ? 'text-blue-600 border-blue-600' 
        : 'text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-600'}`}
      onClick={() => document.dispatchEvent(new Event('routeChangeStart'))}
    >
      {children}
    </Link>
  );
}

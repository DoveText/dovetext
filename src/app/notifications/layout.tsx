'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BellIcon, 
  Cog6ToothIcon, 
  Square3Stack3DIcon,
  ArrowPathIcon, 
  RocketLaunchIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Delivery Methods',
      href: '/notifications/delivery-methods',
      icon: BellIcon,
      current: pathname === '/notifications/delivery-methods',
    },
    {
      name: 'Delivery Channels',
      href: '/notifications/delivery-channels',
      icon: Square3Stack3DIcon,
      current: pathname === '/notifications/delivery-channels',
    },
    {
      name: 'Escalation Chains',
      href: '/notifications/escalation-chains',
      icon: ArrowPathIcon,
      current: pathname === '/notifications/escalation-chains',
    },
    {
      name: 'Delivery Rules',
      href: '/notifications/delivery-rules',
      icon: BoltIcon,
      current: pathname === '/notifications/delivery-rules',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-center space-x-8" aria-label="Tabs">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  item.current
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium'
                )}
              >
                <item.icon
                  className={classNames(
                    item.current
                      ? 'text-indigo-500'
                      : 'text-gray-400 group-hover:text-gray-500',
                    '-ml-0.5 mr-2 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}

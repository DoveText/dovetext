'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Cog6ToothIcon, 
  UserGroupIcon, 
  BellIcon, 
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface AdminTool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function AdminToolsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is admin
    if (!user || user.settings?.role !== 'admin') {
      router.push('/dashboard');
    } else {
      setIsAdmin(true);
    }
  }, [user, router]);

  const adminTools: AdminTool[] = [
    {
      id: 'settings',
      name: 'System Settings',
      description: 'Configure global system settings and parameters',
      icon: <Cog6ToothIcon className="h-8 w-8 text-blue-500" />,
      href: '/admin-tools/settings'
    },
    {
      id: 'users',
      name: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: <UserGroupIcon className="h-8 w-8 text-green-500" />,
      href: '/admin-tools/users'
    },
    {
      id: 'notifications',
      name: 'Notification Templates',
      description: 'Configure system notification templates',
      icon: <BellIcon className="h-8 w-8 text-yellow-500" />,
      href: '/admin-tools/notifications'
    },
    {
      id: 'scheduler',
      name: 'Task Scheduler',
      description: 'Configure and monitor scheduled system tasks',
      icon: <ClockIcon className="h-8 w-8 text-purple-500" />,
      href: '/admin-tools/scheduler'
    },
    {
      id: 'analytics',
      name: 'System Analytics',
      description: 'View system performance and usage statistics',
      icon: <ChartBarIcon className="h-8 w-8 text-red-500" />,
      href: '/admin-tools/analytics'
    },
    {
      id: 'security',
      name: 'Security Settings',
      description: 'Configure security policies and audit logs',
      icon: <ShieldCheckIcon className="h-8 w-8 text-indigo-500" />,
      href: '/admin-tools/security'
    }
  ];

  if (!isAdmin) {
    return null; // Don't render anything while checking admin status
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Tools</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminTools.map((tool) => (
          <Link 
            key={tool.id}
            href={tool.href}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border border-gray-200"
          >
            <div className="p-6 flex-grow">
              <div className="flex items-center mb-4">
                {tool.icon}
                <h2 className="ml-3 text-xl font-semibold text-gray-800">{tool.name}</h2>
              </div>
              <p className="text-gray-600">{tool.description}</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <span className="text-blue-600 font-medium text-sm">Access Tool →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

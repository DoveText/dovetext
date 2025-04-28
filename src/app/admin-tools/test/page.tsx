'use client';

import Link from 'next/link';

interface AdminToolCard {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export default function TestToolsPage() {
  const testTools: AdminToolCard[] = [
    {
      title: 'Notification Delivery',
      description: 'Test notification delivery methods including email and Slack.',
      href: '/admin-tools/test/notification',
      icon: '📨'
    },
    // Add more test tools here as needed
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Test Tools</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testTools.map((tool, index) => (
          <Link
            key={index}
            href={tool.href}
            className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{tool.icon}</span>
                <h2 className="text-xl font-semibold text-gray-800">{tool.title}</h2>
              </div>
              <p className="text-gray-600">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

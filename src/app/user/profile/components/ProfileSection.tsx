'use client';

import { ReactNode } from 'react';

interface ProfileSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Reusable profile section component that provides consistent styling
 * for different sections of the profile page
 */
export default function ProfileSection({ title, description, children }: ProfileSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="bg-white shadow rounded-lg p-6">{children}</div>
    </div>
  );
}

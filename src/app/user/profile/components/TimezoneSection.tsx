'use client';

import TimezoneSelector from '@/components/common/TimezoneSelector';

interface TimezoneSectionProps {
  timezone: string;
  isSavingTimezone: boolean;
  handleSaveTimezone: (newTimezone: string) => Promise<void>;
}

export default function TimezoneSection({
  timezone,
  isSavingTimezone,
  handleSaveTimezone
}: TimezoneSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Your current timezone is: <span className="font-medium text-gray-900">{timezone || 'Not set'}</span>
      </p>
      
      <div>
        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
          Select Timezone
        </label>
        <div className="relative">
          {/* Disable the selector when saving by conditionally rendering a different onChange handler */}
          <TimezoneSelector
            value={timezone}
            onChange={isSavingTimezone ? () => {} : handleSaveTimezone}
          />
          {isSavingTimezone && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-40 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

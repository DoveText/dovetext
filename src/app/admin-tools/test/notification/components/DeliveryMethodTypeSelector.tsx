import React from 'react';
import { DELIVERY_METHOD_TYPES } from '@/app/admin-tools/api/delivery-method-types';

interface DeliveryMethodTypeSelectorProps {
  onSelect: (type: string) => void;
}

const DeliveryMethodTypeSelector: React.FC<DeliveryMethodTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.values(DELIVERY_METHOD_TYPES).map((methodType) => (
        <div
          key={methodType.id}
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onSelect(methodType.id)}
        >
          <div className="flex items-center mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
              {/* Simple icon representation */}
              {methodType.icon === 'mail' && <span>✉️</span>}
              {methodType.icon === 'chat' && <span>💬</span>}
              {methodType.icon === 'phone' && <span>📱</span>}
              {methodType.icon === 'code' && <span>🔗</span>}
            </div>
            <h3 className="text-lg font-medium text-gray-900">{methodType.label}</h3>
          </div>
          <p className="text-sm text-gray-500">
            {methodType.id === 'EMAIL' && 'Send notifications via email'}
            {methodType.id === 'SLACK' && 'Post notifications to Slack channels'}
            {methodType.id === 'TEXT' && 'Send SMS text messages'}
            {methodType.id === 'VOICE' && 'Make automated phone calls'}
            {methodType.id === 'WEBHOOK' && 'Send HTTP requests to external services'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DeliveryMethodTypeSelector;

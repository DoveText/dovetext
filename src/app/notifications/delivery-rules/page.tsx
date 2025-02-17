'use client';

import { useState, useEffect } from 'react';
import { DeliveryRule } from '@/types/delivery-rule';
import DeliveryRuleList from '@/components/notifications/DeliveryRuleList';
import { deliveryRulesApi } from '@/api/delivery-rules';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function DeliveryRulesPage() {
  const [rules, setRules] = useState<DeliveryRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadDeliveryRules();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadDeliveryRules = async () => {
    try {
      setIsLoading(true);
      const data = await deliveryRulesApi.getAll();
      setRules(data);
      setError(null);
    } catch (err) {
      setError('Failed to load delivery rules');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="mt-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        ) : (
          <div className="mt-6">
            <DeliveryRuleList
              rules={rules}
              onRulesChange={loadDeliveryRules}
            />
          </div>
        )}
      </div>
    </div>
  );
}

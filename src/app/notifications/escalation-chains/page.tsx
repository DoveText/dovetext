'use client';

import { useState, useEffect } from 'react';
import { EscalationChain } from '@/types/escalation-chain';
import EscalationChainList from '@/components/notifications/EscalationChainList';
import { escalationChainsApi } from '@/api/escalation-chains';
import { auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function EscalationChainsPage() {
  const [chains, setChains] = useState<EscalationChain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadEscalationChains();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadEscalationChains = async () => {
    try {
      setIsLoading(true);
      const data = await escalationChainsApi.getAll();
      setChains(data);
      setError(null);
    } catch (err) {
      setError('Failed to load escalation chains');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Escalation Chains
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your notification escalation chains
            </p>
          </div>
        </div>

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
          <div className="mt-4 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        ) : (
          <EscalationChainList chains={chains} onUpdate={loadEscalationChains} />
        )}
      </div>
    </div>
  );
}

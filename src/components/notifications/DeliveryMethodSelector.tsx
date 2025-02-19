import { useState, useEffect } from 'react';
import { DeliveryMethod } from '@/types/delivery-method';
import { deliveryMethodsApi } from '@/api/delivery-methods';

interface DeliveryMethodSelectorProps {
  selectedMethodIds: number[];
  onChange: (methodIds: number[]) => void;
  className?: string;
}

export default function DeliveryMethodSelector({
  selectedMethodIds,
  onChange,
  className = '',
}: DeliveryMethodSelectorProps) {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const data = await deliveryMethodsApi.getAll();
        setMethods(data);
      } catch (error) {
        console.error('Failed to fetch delivery methods:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMethods();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading delivery methods...</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {methods.map((method) => (
        <label
          key={method.id}
          className="relative flex items-start"
        >
          <div className="flex h-6 items-center">
            <input
              type="checkbox"
              checked={selectedMethodIds.includes(method.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selectedMethodIds, method.id]);
                } else {
                  onChange(selectedMethodIds.filter(id => id !== method.id));
                }
              }}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
          <div className="ml-3 text-sm leading-6">
            <span className="font-medium text-gray-900">{method.name}</span>
            {method.description && (
              <p className="text-gray-500">{method.description}</p>
            )}
          </div>
        </label>
      ))}
      {methods.length === 0 && (
        <div className="text-sm text-gray-500">
          No delivery methods available. Please create one first.
        </div>
      )}
    </div>
  );
}

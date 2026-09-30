'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type HealthStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'MOCKED'
  | 'CONFIGURED'
  | 'NOT_CONFIGURED'
  | 'AVAILABLE';
type HealthStatusMap = Record<string, HealthStatus>;

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatusMap | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/system-health');
      setHealth((res.data as HealthStatusMap) ?? null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHealth();
  }, []);

  const getHealthColor = (status: string) => {
    switch(status) {
      case 'HEALTHY':
        return 'text-green-600 bg-green-50';
      case 'DEGRADED': return 'text-orange-600 bg-orange-50';
      case 'UNAVAILABLE': return 'text-red-600 bg-red-50';
      case 'MOCKED':
        return 'text-orange-600 bg-orange-50';
      case 'CONFIGURED':
      case 'AVAILABLE': return 'text-blue-600 bg-blue-50';
      case 'NOT_CONFIGURED': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthDotColor = (status: HealthStatus) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-500';
      case 'UNAVAILABLE': return 'bg-red-500';
      case 'DEGRADED':
      case 'MOCKED': return 'bg-orange-500';
      case 'CONFIGURED':
      case 'AVAILABLE': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-500">Service and provider health status.</p>
        </div>
        <button onClick={fetchHealth} className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg">Check Again</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Providers & Services</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Checking health...</div>
        ) : !health ? (
          <div className="p-8 text-center text-sm text-gray-500">Could not retrieve system health.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(health).map(([service, status]) => (
              <div key={service} className="p-6 flex justify-between items-center hover:bg-gray-50/50">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getHealthDotColor(status)}`}></div>
                  <span className="font-medium text-gray-900">{service}</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getHealthColor(status)}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

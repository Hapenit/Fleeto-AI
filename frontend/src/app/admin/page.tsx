'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type DashboardKpis = {
  requirementsToday?: number;
  callsCompleted?: number;
  quotesReceived?: number;
  followUpsPending?: number;
};

type HealthStatusMap = Record<string, 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | string>;

export default function AdminOverviewPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [health, setHealth] = useState<HealthStatusMap | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, healthRes] = await Promise.all([
        api.get('/api/admin/analytics/dashboard'),
        api.get('/api/admin/system-health')
      ]);
      setKpis((kpiRes.data as DashboardKpis) ?? null);
      setHealth((healthRes.data as HealthStatusMap) ?? null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const getHealthColor = (status: string) => {
    switch(status) {
      case 'HEALTHY': return 'text-green-600 bg-green-50';
      case 'DEGRADED': return 'text-orange-600 bg-orange-50';
      case 'UNAVAILABLE': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
        <p className="text-gray-500">Real-time operational health and key metrics.</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading metrics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-sm font-medium text-gray-500">Requirements Today</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{kpis?.requirementsToday || 0}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-sm font-medium text-gray-500">Calls Completed</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{kpis?.callsCompleted || 0}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-sm font-medium text-gray-500">Quotes Received</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{kpis?.quotesReceived || 0}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="text-sm font-medium text-gray-500">Pending Follow-ups</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{kpis?.followUpsPending || 0}</div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-4">System Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {health && Object.entries(health).map(([service, status]: [string, any]) => (
              <div key={service} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="text-sm font-medium text-gray-600 mb-2">{service}</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getHealthColor(status)}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex space-x-4">
            <button onClick={fetchData} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
              Refresh Data
            </button>
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PhoneCall } from 'lucide-react';

type CallOutcomeSummary = {
  status: string;
  _count: { _all: number };
};

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<CallOutcomeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/analytics/calls');
      setCalls((res.data as CallOutcomeSummary[]) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Observability</h1>
        <p className="text-gray-500">AI usage, operational metrics, and call analytics.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
            <PhoneCall className="h-5 w-5 mr-2 text-indigo-600" />
            Call Outcome Distribution
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No call data available.</div>
        ) : (
          <div className="p-6">
            <div className="space-y-4 max-w-lg">
              {calls.map((c) => (
                <div key={c.status} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{c.status}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-100 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${Math.min((c._count._all / 100) * 100, 100)}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">{c._count._all}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

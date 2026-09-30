'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type AiProvider = {
  id: string;
  displayName: string;
  provider: string;
  enabled: boolean;
  priority: number;
  models?: Array<{ id?: string; name?: string }>;
};

export default function AiConfigPage() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/ai/providers');
      setProviders((res.data as AiProvider[]) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProviders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
        <p className="text-gray-500">Manage AI Providers, Models, and Features.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Providers</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading providers...</div>
        ) : providers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No AI providers configured. Configure a provider to enable AI features.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Models Configured</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.displayName} ({p.provider})</td>
                    <td className="px-6 py-4">
                      {p.enabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{p.priority}</td>
                    <td className="px-6 py-4 text-gray-500">{p.models?.length || 0}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button className="text-indigo-600 hover:text-indigo-900 text-xs font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

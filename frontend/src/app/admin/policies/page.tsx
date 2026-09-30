'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type CallingPolicy = {
  id: string;
  name: string;
  enabled?: boolean;
  maxCallDurationSec?: number;
  maxAttempts?: number;
};

export default function PoliciesPage() {
  const [callingPolicies, setCallingPolicies] = useState<CallingPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await api.get<CallingPolicy[]>('/api/admin/config/calling-policies');
      setCallingPolicies(res.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Policies Configuration</h1>
        <p className="text-gray-500">Manage calling, negotiation, and follow-up policies.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Calling Policies</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
        ) : callingPolicies.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No calling policies configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Max Duration (s)</th>
                  <th className="px-6 py-4">Max Attempts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {callingPolicies.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
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
                    <td className="px-6 py-4">{p.maxCallDurationSec}</td>
                    <td className="px-6 py-4">{p.maxAttempts}</td>
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

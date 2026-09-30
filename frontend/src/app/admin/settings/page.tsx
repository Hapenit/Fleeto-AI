'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type SystemSetting = {
  id: string;
  category: string;
  key: string;
  value: unknown;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get<SystemSetting[]>('/api/admin/config/settings');
      setSettings(res.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500">Manage global system settings.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">All Settings</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
        ) : settings.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No system settings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Key</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settings.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{s.category}</td>
                    <td className="px-6 py-4">{s.key}</td>
                    <td className="px-6 py-4 font-mono text-xs">{JSON.stringify(s.value)}</td>
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

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type FollowUpItem = {
  id: string;
  followUpNumber?: string;
  vendor?: { companyName?: string };
  requirement?: { requirementNumber?: string };
  type: string;
  status: string;
  scheduledAt?: string;
};

export default function FollowUpsPage() {
  const router = useRouter();
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; id: string; date: string; reason: string }>({
    isOpen: false,
    id: '',
    date: '',
    reason: ''
  });

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ items?: FollowUpItem[] }>('/follow-ups');
      setFollowUps(res.data.items ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load follow ups');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryNow = async (id: string) => {
    try {
      await api.post(`/follow-ups/${id}/retry`, {});
      fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to retry');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this follow-up?')) return;
    try {
      await api.post(`/follow-ups/${id}/cancel`, { reason: 'User cancelled via dashboard' });
      fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    }
  };

  const submitReschedule = async () => {
    try {
      await api.post(`/follow-ups/${rescheduleModal.id}/reschedule`, {
        scheduledAt: rescheduleModal.date,
        reason: rescheduleModal.reason
      });
      setRescheduleModal({ isOpen: false, id: '', date: '', reason: '' });
      fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'READY': return 'bg-indigo-100 text-indigo-800';
      case 'CALLING': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      case 'FOLLOW_UP_REQUIRED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-up & Retry Management</h1>
          <p className="text-gray-500">Monitor and manage scheduled calls and retries.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading follow-ups...</div>
        ) : followUps.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No follow-ups found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Requirement</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Scheduled At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {followUps.map((fup) => (
                  <tr key={fup.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{fup.followUpNumber}</td>
                    <td className="px-6 py-4">{fup.vendor?.companyName}</td>
                    <td className="px-6 py-4">{fup.requirement?.requirementNumber}</td>
                    <td className="px-6 py-4">{fup.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(fup.status)}`}>
                        {fup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {fup.scheduledAt ? new Date(fup.scheduledAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleRetryNow(fup.id)}
                        disabled={['COMPLETED', 'CANCELLED', 'CALLING'].includes(fup.status)}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                      >
                        Retry Now
                      </button>
                      <button
                        onClick={() => setRescheduleModal({ isOpen: true, id: fup.id, date: fup.scheduledAt ? new Date(fup.scheduledAt).toISOString().slice(0, 16) : '', reason: '' })}
                        disabled={['COMPLETED', 'CANCELLED', 'CALLING'].includes(fup.status)}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(fup.id)}
                        disabled={['COMPLETED', 'CANCELLED', 'CALLING'].includes(fup.status)}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rescheduleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reschedule Follow-up</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date & Time</label>
                <input
                  type="datetime-local"
                  value={rescheduleModal.date}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, date: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Vendor requested"
                  value={rescheduleModal.reason}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, reason: e.target.value })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setRescheduleModal({ isOpen: false, id: '', date: '', reason: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function VoiceConfigPage() {
  const [voiceConfig, setVoiceConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/config/voice');
      setVoiceConfig(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Voice Configuration</h1>
        <p className="text-gray-500">Manage voice and telephony settings.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-medium leading-6 text-gray-900">General Voice Settings</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
        ) : !voiceConfig ? (
          <div className="p-8 text-center text-sm text-gray-500">No voice configuration found.</div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-4">
              <div className="text-sm font-medium text-gray-500">Language</div>
              <div className="col-span-2 text-sm text-gray-900">{voiceConfig.language}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-4">
              <div className="text-sm font-medium text-gray-500">STT Provider</div>
              <div className="col-span-2 text-sm text-gray-900">{voiceConfig.sttProvider}</div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-b border-gray-50 pb-4">
              <div className="text-sm font-medium text-gray-500">TTS Provider</div>
              <div className="col-span-2 text-sm text-gray-900">{voiceConfig.ttsProvider}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-medium text-gray-500">Recording Enabled</div>
              <div className="col-span-2 text-sm text-gray-900">{voiceConfig.recordingEnabled ? 'Yes' : 'No'}</div>
            </div>
            <div className="pt-4 flex justify-end">
               <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg">Edit Settings</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

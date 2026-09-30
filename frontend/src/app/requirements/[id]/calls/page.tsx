"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { Phone, CheckCircle, AlertTriangle, XCircle, Clock, Volume2, User, Mic } from "lucide-react";
import Link from "next/link";

export default function CallsDashboardPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const { data: requirement, isLoading: reqLoading } = useQuery({
    queryKey: ["requirement", id],
    queryFn: async () => (await fetchApi(`/requirements/${id}`)).data
  });

  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ["voice-calls", id],
    queryFn: async () => (await fetchApi(`/voice-calls/requirement/${id}?limit=50`)).data,
    refetchInterval: 5000 // Poll every 5 seconds for live updates
  });

  if (reqLoading || callsLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  const calls = callsData || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <button onClick={() => router.push(`/requirements/${id}/outreach`)} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-2">&larr; Back to Outreach</button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Live Calls Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">Monitor active AI voice conversations and live extractions.</p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {calls.length === 0 ? (
            <div className="col-span-3 text-center p-12 bg-white rounded-lg border border-gray-200">
              <Phone className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No calls initiated yet.</p>
            </div>
          ) : (
            calls.map((call: any) => (
              <div key={call.id} className="bg-white overflow-hidden shadow rounded-lg flex flex-col">
                <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-900 truncate" title={call.vendor.companyName}>
                      {call.vendor.companyName}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${call.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      call.status === 'CONVERSATION' ? 'bg-blue-100 text-blue-800 animate-pulse' : 
                      call.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {call.status}
                  </span>
                </div>
                
                <div className="p-5 flex-1">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-gray-500">Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{call.phoneNumber}</dd>
                    </div>

                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-gray-500">Extraction Progress</dt>
                      <dd className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${calculateExtractionProgress(call.extraction)}%` }}></div>
                        </div>
                      </dd>
                    </div>

                    {call.extraction && (
                      <div className="sm:col-span-2 mt-2">
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">Available:</span>
                            <span className="text-xs font-medium">{call.extraction.vendorAvailable ? 'Yes' : (call.extraction.vendorAvailable === false ? 'No' : '-')}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-500">Quote:</span>
                            <span className="text-xs font-medium">{call.extraction.quotedAmount ? `₹${call.extraction.quotedAmount}` : '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Delivery:</span>
                            <span className="text-xs font-medium truncate ml-2 text-right">{call.extraction.estimatedDeliveryTime || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(call.createdAt).toLocaleTimeString()}
                  </span>
                  <Link href={`/calls/${call.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
                    <Mic className="h-4 w-4 mr-1" /> 
                    Monitor Call
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}

function calculateExtractionProgress(extraction: any) {
  if (!extraction) return 0;
  let score = 0;
  const total = 4;
  if (extraction.vendorAvailable !== null) score++;
  if (extraction.vehicleAvailable !== null) score++;
  if (extraction.quotedAmount !== null) score++;
  if (extraction.estimatedDeliveryTime !== null) score++;
  return (score / total) * 100;
}

"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { Play, Phone, CheckCircle, AlertTriangle, XCircle, PhoneCall } from "lucide-react";

export default function OutreachPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const { data: requirement, isLoading: reqLoading } = useQuery({
    queryKey: ["requirement", id],
    queryFn: async () => (await fetchApi(`/requirements/${id}`)).data
  });

  const { data: outreachSelection, isLoading: outreachLoading } = useQuery({
    queryKey: ["outreach-selection", id],
    queryFn: async () => (await fetchApi(`/requirements/${id}/outreach/vendors`)).data
  });

  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ["voice-calls", id],
    queryFn: async () => (await fetchApi(`/voice-calls/requirement/${id}?limit=50`)).data
  });

  const batchCallMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi(`/voice-calls/batch`, { 
        method: "POST", 
        body: JSON.stringify({ requirementId: id }) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-calls", id] });
    }
  });

  if (reqLoading || outreachLoading || callsLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  const calls = callsData || [];
  const selectedVendors = outreachSelection || [];

  const handleStartOutreach = () => {
    if (confirm("Start AI voice calls to all selected vendors?")) {
      batchCallMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <button onClick={() => router.push(`/requirements/${id}`)} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-2">&larr; Back to Requirement</button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Vendor Outreach
            </h2>
            <p className="mt-1 text-sm text-gray-500">Manage and monitor AI voice calls for selected vendors.</p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => router.push(`/requirements/${id}/calls`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-3"
            >
              View Call Dashboard
            </button>
            <button
              onClick={handleStartOutreach}
              disabled={batchCallMutation.isPending || selectedVendors.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {batchCallMutation.isPending ? 'Initiating...' : <><PhoneCall className="-ml-1 mr-2 h-4 w-4" /> Start AI Calls</>}
            </button>
          </div>
        </div>

        {/* Selected Vendors List */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Selected Vendors ({selectedVendors.length})</h3>
          </div>
          
          {selectedVendors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              No vendors selected for outreach. Please go to Matching & Ranking to select vendors.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {selectedVendors.map((selection: any) => {
                const call = calls.find((c: any) => c.vendorId === selection.vendorId);
                
                return (
                  <li key={selection.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-blue-600 truncate">{selection.vendor.companyName}</p>
                        <p className="text-sm text-gray-500">
                          {selection.vendor.vendorCode} • {selection.vendor.primaryPhone}
                        </p>
                      </div>
                      
                      <div className="flex items-center">
                        {!call ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Called Yet
                          </span>
                        ) : (
                          <div className="flex items-center space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                              ${call.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                call.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                                call.status === 'QUEUED' || call.status === 'INITIATING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'}`}>
                              {call.status}
                            </span>
                            
                            <button
                              onClick={() => router.push(`/calls/${call.id}`)}
                              className="text-sm text-blue-600 hover:text-blue-900 font-medium"
                            >
                              View Call
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {call?.outcome && (
                      <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                        <strong>Outcome:</strong> {call.outcome.outcome} 
                        {call.extraction?.quotedAmount ? ` (Quote: ₹${call.extraction.quotedAmount})` : ''}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </main>
    </div>
  );
}

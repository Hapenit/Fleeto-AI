"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, AlertTriangle, Play, Edit, Copy, XCircle, Sparkles, Phone } from "lucide-react";

export default function RequirementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  
  const [valResult, setValResult] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['requirement', id],
    queryFn: () => fetchApi(`/requirements/${id}`).then(res => res.data),
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status: string) => fetchApi(`/requirements/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requirement', id] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => fetchApi(`/requirements/${id}/duplicate`, { method: "POST" }),
    onSuccess: (res) => router.push(`/requirements/${res.data.id}`),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => fetchApi(`/requirements/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason })
    }),
    onSuccess: () => {
      setShowCancel(false);
      queryClient.invalidateQueries({ queryKey: ['requirement', id] });
    },
  });

  const handleValidate = () => {
    if (data?.validationResult) {
      setValResult(data.validationResult);
    }
  };

  const handleMarkReady = () => {
    if (data?.validationResult?.valid) {
      changeStatusMutation.mutate("READY");
    } else {
      alert("Please fix validation errors first.");
      handleValidate();
    }
  };

  const handleStartMatching = () => {
    changeStatusMutation.mutate("MATCHING");
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center">Loading requirement...</div></div>;
  if (error || !data) return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center text-red-500">Failed to load requirement.</div></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{data.requirementNumber}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                {data.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {data.customerName} • {data.pickupLocation || 'TBD'} → {data.deliveryLocation || 'TBD'}
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {(data.status === 'DRAFT' || data.status === 'VALIDATION_REQUIRED' || data.status === 'READY') && (
              <button 
                onClick={() => router.push(`/requirements/${data.id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" /> Edit
              </button>
            )}
            
            <button 
              onClick={() => duplicateMutation.mutate()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Copy className="h-4 w-4 mr-2" /> Duplicate
            </button>

            {data.status === 'DRAFT' && (
              <button 
                onClick={handleValidate}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Validate
              </button>
            )}
            
            {data.status === 'DRAFT' && valResult?.valid && (
              <button 
                onClick={handleMarkReady}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> Mark Ready
              </button>
            )}

            {data.status === 'READY' && (
              <button 
                onClick={handleStartMatching}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Play className="h-4 w-4 mr-2" /> Start Procurement
              </button>
            )}

            {(data.status === 'MATCHING' || data.status === 'CALLING') && (
              <>
                <button 
                  onClick={() => router.push(`/requirements/${data.id}/eligibility`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Eligibility
                </button>
                <button 
                  onClick={() => router.push(`/requirements/${data.id}/matching`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Play className="h-4 w-4 mr-2" /> Matching & Ranking
                </button>
                <button 
                  onClick={() => router.push(`/requirements/${data.id}/outreach`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Phone className="h-4 w-4 mr-2" /> Outreach
                </button>
              </>
            )}
            
            {(data.status === 'CALLING' || data.status === 'COMPLETED' || data.status === 'VENDOR_SELECTED') && (
              <>
                <button 
                  onClick={() => router.push(`/requirements/${data.id}/quotations`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Quotations
                </button>
                <button 
                  onClick={() => router.push(`/requirements/${data.id}/comparison`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  Compare
                </button>
                <button 
                  onClick={() => router.push(`/requirements/${data.id}/procurement`)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Decision Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        {valResult && !valResult.valid && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Requirement needs attention</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {valResult.missingFields.map((f: string) => <li key={f}>Missing mandatory field: {f}</li>)}
                    {valResult.errors.map((e: string) => <li key={e}>{e}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {valResult && valResult.valid && data.status === 'DRAFT' && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-sm font-medium text-green-800">✓ Requirement is valid and ready for matching</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer & Route Details */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Details</h3>
              </div>
              <div className="px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Customer</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.customerName} {data.customerCompany ? `(${data.customerCompany})` : ''}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Pickup</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.pickupLocation} • {data.pickupDate ? format(new Date(data.pickupDate), 'dd MMM yyyy') : 'No Date'}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Delivery</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.deliveryLocation} • {data.deliveryDeadline ? format(new Date(data.deliveryDeadline), 'dd MMM yyyy') : 'No Deadline'}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Cargo</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.cargoType} • {data.cargoWeight ? `${data.cargoWeight} ${data.cargoWeightUnit}` : 'No Weight'}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Vehicle Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.vehicleType || '-'}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Budget</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.budget ? `${data.budgetCurrency} ${data.budget}` : '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Procurement Progress Placeholder */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Procurement Progress</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <ul className="space-y-4">
                  <li className="flex items-center text-sm"><CheckCircle className="h-5 w-5 text-green-500 mr-3" /> Requirement Created</li>
                  <li className="flex items-center text-sm"><CheckCircle className={`h-5 w-5 mr-3 ${data.status !== 'DRAFT' ? 'text-green-500' : 'text-gray-300'}`} /> Validated & Ready</li>
                  <li className="flex items-center text-sm"><div className={`h-5 w-5 rounded-full border-2 mr-3 ${data.status === 'MATCHING' || data.status === 'CALLING' || data.status === 'COMPLETED' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}></div> Vendor Matching</li>
                  <li className="flex items-center text-sm"><div className={`h-5 w-5 rounded-full border-2 mr-3 ${data.status === 'CALLING' || data.status === 'COMPLETED' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}></div> AI Calling</li>
                  <li className="flex items-center text-sm text-gray-400"><div className="h-5 w-5 rounded-full border-2 border-gray-200 mr-3"></div> Quotations Received (Future Module)</li>
                </ul>
              </div>
            </div>

          </div>
          
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Status History</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {data.statusHistory?.map((event: any, idx: number) => (
                      <li key={event.id}>
                        <div className="relative pb-8">
                          {idx !== data.statusHistory.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <span className="text-white text-xs font-bold">{idx + 1}</span>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">Status changed to <span className="font-medium text-gray-900">{event.toStatus}</span></p>
                                {event.reason && <p className="text-xs text-gray-400">{event.reason}</p>}
                                <p className="text-xs text-gray-400">by {event.changedBy?.firstName} {event.changedBy?.lastName}</p>
                              </div>
                              <div className="text-right text-xs whitespace-nowrap text-gray-500">
                                {format(new Date(event.createdAt), 'MMM d, h:mm a')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* AI Extractions History */}
            {data.aiExtractions?.length > 0 && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-purple-500" /> AI Extractions
                  </h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <ul className="space-y-4">
                    {data.aiExtractions.map((ext: any, idx: number) => (
                      <li key={ext.id} className="text-sm border-l-2 border-purple-200 pl-3">
                        <div className="font-medium text-gray-900">Extraction #{data.aiExtractions.length - idx}</div>
                        <div className="text-xs text-gray-500">{format(new Date(ext.createdAt), 'dd MMM yyyy, h:mm a')}</div>
                        <div className="text-gray-600 mt-1">Model: {ext.provider} {ext.model}</div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ext.status === 'APPLIED' ? 'bg-green-100 text-green-800' : ext.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {ext.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Cancel Actions */}
            {data.status !== 'CANCELLED' && data.status !== 'COMPLETED' && (
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-red-600">Danger Zone</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Cancel this requirement if it is no longer needed.</p>
                  </div>
                  <div className="mt-5">
                    {!showCancel ? (
                      <button onClick={() => setShowCancel(true)} className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 text-sm">
                        Cancel Requirement
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          placeholder="Reason for cancellation..."
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full border border-gray-300 rounded p-2 text-sm"
                          rows={2}
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => cancelMutation.mutate(cancelReason)}
                            disabled={!cancelReason.trim() || cancelMutation.isPending}
                            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                          >
                            Confirm Cancel
                          </button>
                          <button onClick={() => setShowCancel(false)} className="px-3 py-1.5 border border-gray-300 rounded text-sm">Back</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

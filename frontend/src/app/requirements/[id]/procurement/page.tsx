"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Header from "@/components/layout/Header";
import { ArrowLeft, CheckCircle, ShieldCheck, AlertTriangle, FileText, Check, Save } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ProcurementDecisionPage() {
  const params = useParams();
  const router = useRouter();
  const requirementId = params.id as string;
  const queryClient = useQueryClient();

  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: requirement, isLoading: reqLoading } = useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: () => fetchApi(`/requirements/${requirementId}`).then(res => res.data),
  });

  const { data: comparison, isLoading: compLoading } = useQuery({
    queryKey: ['comparison', requirementId],
    queryFn: () => fetchApi(`/requirements/${requirementId}/comparison`).then(res => res.data),
  });

  const { data: decision, isLoading: decLoading, isError: decError } = useQuery({
    queryKey: ['procurement-decision', requirementId],
    queryFn: () => fetchApi(`/requirements/${requirementId}/procurement/decision`, { method: "POST" }).then(res => res.data),
    staleTime: 0,
    retry: false
  });

  const confirmMutation = useMutation({
    mutationFn: (data: any) => fetchApi(`/procurement-decisions/${decision.id}/confirm`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: (res) => {
      toast.success("Procurement decision confirmed successfully!");
      setShowConfirmModal(false);
      router.push(`/procurement-decisions/${res.data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to confirm decision.");
      setShowConfirmModal(false);
    }
  });

  if (reqLoading || compLoading || decLoading) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center">Loading decision workspace...</div></div>;
  }

  // If already decided and we fetched it, we might be redirected or just show completed.
  if (decision?.status === 'CONFIRMED') {
    router.replace(`/procurement-decisions/${decision.id}`);
    return null;
  }

  const items = comparison?.items || [];
  const selectedQuote = items.find((i: any) => i.quotationId === selectedQuoteId);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="mb-4">
          <Link href={`/requirements/${requirementId}/comparison`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Comparison
          </Link>
        </div>

        <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldCheck className="h-6 w-6 mr-2 text-indigo-500" /> Procurement Decision
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Requirement: <span className="font-medium text-gray-900">{requirement?.requirementNumber}</span> • 
            Decision Workspace: <span className="font-medium text-gray-900 ml-1">{decision?.decisionNumber}</span>
          </p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-800">
            <p className="font-bold mb-1">Human Decision Layer</p>
            <p>Please review the facts below and explicitly select the quotation that fulfills this requirement. This action will confirm the vendor selection. It does NOT automatically book the vehicle or make payments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content - Quotation list */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Available Quotations</h2>
            {items.map((item: any) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-lg border-2 p-5 transition-all ${
                  selectedQuoteId === item.quotationId 
                    ? 'border-indigo-600 shadow-md ring-1 ring-indigo-600' 
                    : 'border-gray-200 shadow-sm hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{item.vendor?.companyName}</h3>
                    <p className="text-sm text-gray-500 flex items-center mb-4">
                      <FileText className="h-4 w-4 mr-1" /> {item.quotation?.quotationNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Known Total</p>
                    <p className="text-2xl font-bold text-green-700">{item.currency} {item.knownTotalAmount}</p>
                    {item.unknownChargeCount > 0 && (
                      <p className="text-xs text-yellow-600 mt-1 flex justify-end items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" /> +{item.unknownChargeCount} Unknown Charges
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Delivery</p>
                    <p className="text-sm font-medium text-gray-900">{item.deliveryDuration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Final Quote (Base)</p>
                    <p className="text-sm font-medium text-gray-900">{item.currency} {item.finalAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Known Additional</p>
                    <p className="text-sm font-medium text-gray-900">{item.currency} {item.knownAdditionalChargesAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Confirmation</p>
                    <p className="text-sm font-medium text-gray-900">
                      {item.vendorConfirmed ? (
                        <span className="text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Confirmed</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </p>
                  </div>
                </div>

                {item.mismatches?.length > 0 && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-800">
                    <p className="font-bold flex items-center mb-1"><AlertTriangle className="h-4 w-4 mr-1" /> Requirement Mismatches</p>
                    <ul className="list-disc pl-5">
                      {item.mismatches.map((m: any) => (
                        <li key={m.id}>{m.type.replace(/_/g, ' ')}: {m.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Link href={`/quotations/${item.quotationId}`} target="_blank" className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-900 mr-4">
                    View Full Details
                  </Link>
                  {selectedQuoteId !== item.quotationId ? (
                    <button 
                      onClick={() => setSelectedQuoteId(item.quotationId)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Select Quotation
                    </button>
                  ) : (
                    <button 
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 cursor-default"
                    >
                      <Check className="h-4 w-4 mr-1" /> Selected
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar - Action Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Finalize Decision</h3>
              
              {!selectedQuoteId ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-500 text-center mb-4">
                  Please select a quotation from the list to continue.
                </div>
              ) : (
                <div className="mb-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded mb-4">
                    <p className="text-xs text-indigo-800 uppercase font-bold mb-1">Selected Vendor</p>
                    <p className="text-sm font-bold text-indigo-900">{selectedQuote?.vendor?.companyName}</p>
                    <p className="text-xs text-indigo-700">{selectedQuote?.quotation?.quotationNumber}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Decision Reason *</label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={3}
                        placeholder="Why are you selecting this quotation?"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum 10 characters.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                        placeholder="Optional internal notes..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setShowConfirmModal(true)}
                disabled={!selectedQuoteId || reason.length < 10}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                Confirm Procurement
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && selectedQuote && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <ShieldCheck className="h-6 w-6 text-green-600 mr-2" /> Confirm Selection
                </h3>
              </div>
              <div className="px-6 py-5 bg-gray-50 space-y-4">
                <div className="text-sm text-gray-700">
                  <p className="mb-2 font-bold text-gray-900">You are selecting:</p>
                  <div className="bg-white p-3 border border-gray-200 rounded">
                    <p className="font-bold">{selectedQuote.vendor?.companyName}</p>
                    <p className="text-gray-500">{selectedQuote.quotation?.quotationNumber}</p>
                    <p className="mt-2 text-green-700 font-bold">Total: {selectedQuote.currency} {selectedQuote.knownTotalAmount}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="font-bold text-gray-900 mb-1">This action will:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Mark this quotation as SELECTED</li>
                    <li>Update requirement status to VENDOR_SELECTED</li>
                    <li>Preserve other quotations as NOT_SELECTED</li>
                    <li>Create an auditable procurement decision</li>
                  </ul>
                </div>
                <div className="text-sm text-red-700 bg-red-50 p-3 border border-red-100 rounded">
                  <p className="font-bold mb-1">This does NOT:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Book the vehicle</li>
                    <li>Create a transport order</li>
                    <li>Make a payment</li>
                  </ul>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-white">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={confirmMutation.isPending}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button 
                  onClick={() => confirmMutation.mutate({
                    quotationId: selectedQuote.quotationId,
                    version: decision.version,
                    reason,
                    notes
                  })}
                  disabled={confirmMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center"
                >
                  {confirmMutation.isPending ? "Confirming..." : "Confirm Procurement Decision"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

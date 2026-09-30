"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { BrainCircuit, CheckCircle, AlertTriangle, FileText, ChevronRight, PlayCircle, Loader2 } from "lucide-react";

export default function CallAnalysisPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const [activeEvidence, setActiveEvidence] = useState<any | null>(null);

  const { data: analysisResult, isLoading, refetch } = useQuery({
    queryKey: ["call-analysis", id],
    queryFn: async () => (await fetchApi(`/calls/${id}/analysis`)).data,
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => await fetchApi(`/calls/${id}/analysis`, { method: "POST" }),
    onSuccess: () => {
      // Keep refetching until status is COMPLETED
      const interval = setInterval(async () => {
        const res = await refetch();
        if (res.data?.status === 'COMPLETED' || res.data?.status === 'FAILED' || res.data?.status === 'NEEDS_REVIEW') {
          clearInterval(interval);
        }
      }, 2000);
    }
  });

  const analysis = analysisResult;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
              <BrainCircuit className="h-7 w-7 mr-3 text-indigo-600" />
              AI Conversation Analysis
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                Call: {id.substring(0, 8)}
              </div>
              {analysis?.call?.vendor && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  Vendor: {analysis.call.vendor.companyName}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending || analysis?.status === 'PROCESSING'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {(analyzeMutation.isPending || analysis?.status === 'PROCESSING') ? (
                <><Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Processing...</>
              ) : (
                <><PlayCircle className="-ml-1 mr-2 h-5 w-5" /> {analysis ? 'Re-Analyze' : 'Analyze Call'}</>
              )}
            </button>
          </div>
        </div>

        {!analysis && !isLoading ? (
          <div className="text-center py-20 bg-white shadow rounded-lg border border-gray-200">
            <BrainCircuit className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Analysis Found</h3>
            <p className="mt-1 text-sm text-gray-500">This call has not been analyzed yet.</p>
            <div className="mt-6">
              <button
                onClick={() => analyzeMutation.mutate()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Analysis
              </button>
            </div>
          </div>
        ) : analysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Call Summary</h3>
                <div className="prose prose-sm text-gray-700">
                  {analysis.overallSummary || "No summary available."}
                </div>
              </div>

              {/* Conditions & Objections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                    Vendor Conditions
                  </h3>
                  <ul className="space-y-3">
                    {analysis.findings?.filter((f: any) => f.type === 'CONDITION').map((f: any) => (
                      <li key={f.id} className="text-sm text-gray-700 flex justify-between items-start">
                        <span className="flex-1">• {f.description}</span>
                        {f.evidence?.length > 0 && (
                          <button onClick={() => setActiveEvidence(f.evidence)} className="text-xs text-indigo-600 hover:text-indigo-800 ml-2 whitespace-nowrap">
                            [Evidence]
                          </button>
                        )}
                      </li>
                    ))}
                    {analysis.findings?.filter((f: any) => f.type === 'CONDITION').length === 0 && (
                      <li className="text-sm text-gray-500 italic">No explicit conditions detected.</li>
                    )}
                  </ul>
                </div>

                <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                    Objections
                  </h3>
                  <ul className="space-y-3">
                    {analysis.findings?.filter((f: any) => f.type === 'OBJECTION').map((f: any) => (
                      <li key={f.id} className="text-sm text-gray-700 flex justify-between items-start">
                        <span className="flex-1">• {f.description}</span>
                        {f.evidence?.length > 0 && (
                          <button onClick={() => setActiveEvidence(f.evidence)} className="text-xs text-indigo-600 hover:text-indigo-800 ml-2 whitespace-nowrap">
                            [Evidence]
                          </button>
                        )}
                      </li>
                    ))}
                    {analysis.findings?.filter((f: any) => f.type === 'OBJECTION').length === 0 && (
                      <li className="text-sm text-gray-500 italic">No objections detected.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Negotiation Signals */}
              <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Negotiation Signals</h3>
                <ul className="space-y-3">
                  {analysis.findings?.filter((f: any) => f.type === 'NEGOTIATION_SIGNAL').map((f: any) => (
                    <li key={f.id} className="text-sm text-gray-700 flex justify-between items-start">
                      <span className="flex-1">• {f.description}</span>
                      {f.evidence?.length > 0 && (
                        <button onClick={() => setActiveEvidence(f.evidence)} className="text-xs text-indigo-600 hover:text-indigo-800 ml-2">
                          [Evidence]
                        </button>
                      )}
                    </li>
                  ))}
                  {analysis.findings?.filter((f: any) => f.type === 'NEGOTIATION_SIGNAL').length === 0 && (
                    <li className="text-sm text-gray-500 italic">No negotiation signals detected.</li>
                  )}
                </ul>
              </div>

              {/* Risks & Unanswered Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg border border-red-200 p-6">
                  <h3 className="text-lg leading-6 font-medium text-red-800 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" /> Risks / Clarifications
                  </h3>
                  <ul className="space-y-3">
                    {analysis.findings?.filter((f: any) => f.type === 'RISK').map((f: any) => (
                      <li key={f.id} className="text-sm text-gray-700 flex justify-between items-start">
                        <span className="flex-1">
                          <span className="font-semibold text-red-600 mr-2">[{f.severity}]</span>
                          {f.description}
                        </span>
                        {f.evidence?.length > 0 && (
                          <button onClick={() => setActiveEvidence(f.evidence)} className="text-xs text-indigo-600 hover:text-indigo-800 ml-2">
                            [Evidence]
                          </button>
                        )}
                      </li>
                    ))}
                    {analysis.findings?.filter((f: any) => f.type === 'RISK').length === 0 && (
                      <li className="text-sm text-gray-500 italic">No major risks identified.</li>
                    )}
                  </ul>
                </div>

                <div className="bg-white shadow rounded-lg border border-yellow-200 p-6">
                  <h3 className="text-lg leading-6 font-medium text-yellow-800 mb-4 flex items-center">
                    Missing Information
                  </h3>
                  <ul className="space-y-3">
                    {analysis.findings?.filter((f: any) => f.type === 'UNANSWERED_QUESTION').map((f: any) => (
                      <li key={f.id} className="text-sm text-gray-700">
                        ⚠ {f.description}
                      </li>
                    ))}
                    {analysis.findings?.filter((f: any) => f.type === 'UNANSWERED_QUESTION').length === 0 && (
                      <li className="text-sm text-gray-500 italic">No missing information noted.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Procurement Facts */}
              <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Procurement Facts</h3>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Interest</dt>
                    <dd className="text-sm font-semibold text-gray-900">{analysis.vendorInterest}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Availability</dt>
                    <dd className="text-sm font-semibold text-gray-900">{analysis.availabilityStatus}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Quote</dt>
                    <dd className="text-sm font-semibold text-green-600">
                      {analysis.quoteAmount ? `${analysis.quoteCurrency} ${analysis.quoteAmount}` : 'Unclear / None'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Analysis Confidence</dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      {analysis.analysisConfidence ? `${(analysis.analysisConfidence * 100).toFixed(0)}%` : 'N/A'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm font-semibold text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${analysis.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          analysis.status === 'NEEDS_REVIEW' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {analysis.status}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Evidence Drawer */}
              {activeEvidence && (
                <div className="bg-white shadow rounded-lg border border-indigo-200 p-6 overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-indigo-900 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" /> Transcript Evidence
                    </h3>
                    <button onClick={() => setActiveEvidence(null)} className="text-gray-400 hover:text-gray-500">
                      &times;
                    </button>
                  </div>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {activeEvidence.map((ev: any) => (
                      <div key={ev.id} className="bg-indigo-50 p-3 rounded text-sm text-indigo-900">
                        <div className="text-xs text-indigo-400 mb-1">Sequence: {ev.sequenceNumber}</div>
                        "{ev.quotedText}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>
        ) : (
          <div className="text-center py-20"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600" /></div>
        )}
      </main>
    </div>
  );
}

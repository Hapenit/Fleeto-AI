"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle, AlertTriangle, XCircle, Search, Filter, Play, ChevronRight, CheckCircle2 } from "lucide-react";

export default function EligibilityPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 20;

  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);

  const { data: requirement, isLoading: reqLoading } = useQuery({
    queryKey: ["requirement", id],
    queryFn: async () => (await fetchApi(`/requirements/${id}`)).data
  });

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["eligibility-summary", id],
    queryFn: async () => (await fetchApi(`/requirements/${id}/eligibility/summary`)).data
  });

  const { data: evalsData, isLoading: evalsLoading } = useQuery({
    queryKey: ["eligibility-evals", id, page, statusFilter, summary?.id], // refetch if new run happens
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (statusFilter) params.append("status", statusFilter);
      return (await fetchApi(`/requirements/${id}/eligibility?${params.toString()}`));
    },
    enabled: !!summary
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi(`/requirements/${id}/eligibility/re-evaluate`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eligibility-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["eligibility-evals", id] });
    }
  });

  const evals = evalsData?.data || [];
  const pagination = evalsData?.pagination;

  const handleEvaluate = () => {
    evaluateMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'FAILED') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'NEEDS_REVIEW') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800';
  };

  if (reqLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  const selectedEval = selectedEvalId ? evals.find((e: any) => e.id === selectedEvalId) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <button onClick={() => router.push(`/requirements/${id}`)} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-2">&larr; Back to Requirement</button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Vendor Eligibility
            </h2>
            <p className="mt-1 text-sm text-gray-500">Determine which vendors can fulfill requirement {requirement?.requirementNumber}.</p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleEvaluate}
              disabled={evaluateMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {evaluateMutation.isPending ? 'Evaluating...' : <><Play className="-ml-1 mr-2 h-4 w-4" /> Evaluate Vendors</>}
            </button>
          </div>
        </div>

        {/* Summary Section */}
        {sumLoading ? (
          <div className="bg-white shadow sm:rounded-lg p-6 mb-8 text-center text-gray-500">Loading summary...</div>
        ) : summary ? (
          <div className="bg-white shadow sm:rounded-lg overflow-hidden mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Evaluation Summary</h3>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Evaluated</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{summary.totalVendors}</dd>
                </div>
                <div className="px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6 border border-green-100">
                  <dt className="text-sm font-medium text-green-600 truncate">Eligible</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-700">{summary.eligibleCount}</dd>
                </div>
                <div className="px-4 py-5 bg-yellow-50 shadow rounded-lg overflow-hidden sm:p-6 border border-yellow-100">
                  <dt className="text-sm font-medium text-yellow-600 truncate">Needs Review</dt>
                  <dd className="mt-1 text-3xl font-semibold text-yellow-700">{summary.needsReviewCount}</dd>
                </div>
                <div className="px-4 py-5 bg-red-50 shadow rounded-lg overflow-hidden sm:p-6 border border-red-100">
                  <dt className="text-sm font-medium text-red-600 truncate">Ineligible</dt>
                  <dd className="mt-1 text-3xl font-semibold text-red-700">{summary.ineligibleCount}</dd>
                </div>
              </dl>
              <div className="mt-4 text-xs text-gray-500 text-right">
                Engine Version: {summary.engineVersion} | Evaluated at: {format(new Date(summary.createdAt), 'PPpp')}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow sm:rounded-lg p-12 mb-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Evaluation History</h3>
            <p className="mt-1 text-sm text-gray-500">Run the eligibility engine to find matching vendors.</p>
          </div>
        )}

        {/* Vendors List Section */}
        {summary && (
          <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex items-center space-x-4">
                <div className="sm:w-64 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  >
                    <option value="">All Eligibility Status</option>
                    <option value="COMPLETED">Eligible</option>
                    <option value="FAILED">Ineligible</option>
                    <option value="NEEDS_REVIEW">Needs Review</option>
                  </select>
                </div>
              </div>
            </div>
            
            {evalsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading results...</div>
            ) : evals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No vendors match the current filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rules Passed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eligibility</th>
                      <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {evals.map((ev: any) => (
                      <tr key={ev.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEvalId(ev.id)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ev.vendor.companyName}</div>
                          <div className="text-sm text-gray-500">{ev.vendor.vendorCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${ev.confidence}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{Math.round(ev.confidence)}%</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ev.passedRules} / {ev.passedRules + ev.failedRules + ev.reviewRules} Applicable
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(ev.status)}`}>
                            {ev.status === 'COMPLETED' ? 'ELIGIBLE' : ev.status === 'FAILED' ? 'INELIGIBLE' : 'NEEDS REVIEW'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => setSelectedEvalId(ev.id)} className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full">
                            Details <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span>
                  </p>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start Procurement Action */}
        {summary && summary.eligibleCount > 0 && (
          <div className="flex justify-end mt-8">
            <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
              Continue to Vendor Matching <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        )}

      </main>

      {/* Rule Details Modal/Drawer Overlay */}
      {selectedEvalId && selectedEval && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedEvalId(null)}></div>
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">Evaluation Details</h2>
                      <div className="ml-3 flex h-7 items-center">
                        <button type="button" onClick={() => setSelectedEvalId(null)} className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <span className="sr-only">Close panel</span>
                          <XCircle className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-xl font-bold text-gray-900">{selectedEval.vendor.companyName}</h3>
                      <p className="text-sm text-gray-500 mb-3">{selectedEval.vendor.vendorCode}</p>
                      
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full border ${getStatusColor(selectedEval.status)}`}>
                        {selectedEval.status === 'COMPLETED' ? 'ELIGIBLE' : selectedEval.status === 'FAILED' ? 'INELIGIBLE' : 'NEEDS REVIEW'}
                      </span>
                    </div>
                  </div>
                  <div className="relative flex-1 px-4 py-6 sm:px-6">
                    
                    {/* If Ineligible or Needs Review, show a summary of why at the top */}
                    {selectedEval.status !== 'COMPLETED' && (
                      <div className={`mb-6 p-4 rounded-md border ${selectedEval.status === 'FAILED' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <h4 className={`text-sm font-bold mb-2 ${selectedEval.status === 'FAILED' ? 'text-red-800' : 'text-yellow-800'}`}>
                          {selectedEval.status === 'FAILED' ? 'Why is this vendor ineligible?' : 'Why does this vendor need review?'}
                        </h4>
                        <ul className="space-y-2">
                          {selectedEval.ruleResults
                            .filter((r: any) => (selectedEval.status === 'FAILED' ? r.status === 'FAIL' : r.status === 'REVIEW'))
                            .map((r: any) => (
                              <li key={r.id} className="text-sm text-gray-700 flex items-start">
                                <span className="mr-2 mt-0.5">•</span>
                                <div>
                                  <span className="font-semibold">{r.ruleName}:</span> {r.message}
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Rule Execution Log</h4>
                    <ul className="space-y-4">
                      {selectedEval.ruleResults.map((r: any) => (
                        <li key={r.id} className="bg-white border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 text-sm">{r.ruleName}</span>
                            <span className={`text-xs px-2 py-1 rounded font-bold ${
                              r.status === 'PASS' ? 'text-green-700 bg-green-100' :
                              r.status === 'FAIL' ? 'text-red-700 bg-red-100' :
                              r.status === 'REVIEW' ? 'text-yellow-700 bg-yellow-100' : 'text-gray-600 bg-gray-100'
                            }`}>
                              {r.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{r.message}</p>
                          {r.details && (
                            <pre className="text-xs bg-gray-50 p-2 rounded text-gray-700 overflow-x-auto border">
                              {JSON.stringify(r.details, null, 2)}
                            </pre>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { Play, ChevronRight, XCircle, AlertTriangle, CheckSquare, Search } from "lucide-react";

export default function MatchingPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const limit = 20;

  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const MAX_OUTREACH = 5;

  const { data: requirement, isLoading: reqLoading } = useQuery({
    queryKey: ["requirement", id],
    queryFn: async () => (await fetchApi(`/requirements/${id}`)).data
  });

  const { data: rankingsData, isLoading: rankingsLoading } = useQuery({
    queryKey: ["matching-rankings", id, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      return (await fetchApi(`/requirements/${id}/matching?${params.toString()}`));
    },
  });

  const { data: outreachSelection } = useQuery({
    queryKey: ["outreach-selection", id],
    queryFn: async () => (await fetchApi(`/requirements/${id}/outreach/vendors`)).data
  });

  const generateRankingMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi(`/matching/rank`, { 
        method: "POST", 
        body: JSON.stringify({ requirementId: id }) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matching-rankings", id] });
    }
  });

  const saveOutreachMutation = useMutation({
    mutationFn: async (vendorIds: string[]) => {
      return await fetchApi(`/requirements/${id}/outreach/vendors`, {
        method: "POST",
        body: JSON.stringify({ vendorIds })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outreach-selection", id] });
      alert("Vendors confirmed for outreach!");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to save outreach selection.");
    }
  });

  const rankings = rankingsData?.data || [];
  const pagination = rankingsData?.pagination;
  const run = rankingsData?.run;

  const handleGenerateRanking = () => {
    generateRankingMutation.mutate();
  };

  const handleToggleSelect = (vendorId: string) => {
    if (selectedVendors.includes(vendorId)) {
      setSelectedVendors(selectedVendors.filter(v => v !== vendorId));
    } else {
      if (selectedVendors.length >= MAX_OUTREACH) {
        alert(`You can select up to ${MAX_OUTREACH} vendors for this outreach batch.`);
        return;
      }
      setSelectedVendors([...selectedVendors, vendorId]);
    }
  };

  const handleConfirmOutreach = () => {
    if (selectedVendors.length === 0) return;
    if (confirm(`Confirm ${selectedVendors.length} vendors for outreach?`)) {
      saveOutreachMutation.mutate(selectedVendors);
    }
  };

  if (reqLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;

  const selectedEval = selectedEvalId ? rankings.find((e: any) => e.id === selectedEvalId) : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <button onClick={() => router.push(`/requirements/${id}`)} className="text-sm font-medium text-gray-500 hover:text-gray-900 mb-2">&larr; Back to Requirement</button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Vendor Matching
            </h2>
            <p className="mt-1 text-sm text-gray-500">Rank eligible vendors based on operational and historical fit.</p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleGenerateRanking}
              disabled={generateRankingMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {generateRankingMutation.isPending ? 'Generating...' : <><Play className="-ml-1 mr-2 h-4 w-4" /> Generate Matching</>}
            </button>
          </div>
        </div>

        {/* Summary Section */}
        {run ? (
          <div className="bg-white shadow sm:rounded-lg overflow-hidden mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Matching Run Summary</h3>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                <div className="px-4 py-5 bg-gray-50 shadow rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Eligible Candidates</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{run.candidateCount}</dd>
                </div>
                <div className="px-4 py-5 bg-blue-50 shadow rounded-lg overflow-hidden sm:p-6 border border-blue-100">
                  <dt className="text-sm font-medium text-blue-600 truncate">Ranked Vendors</dt>
                  <dd className="mt-1 text-3xl font-semibold text-blue-700">{run.rankedCount}</dd>
                </div>
                <div className="px-4 py-5 bg-green-50 shadow rounded-lg overflow-hidden sm:p-6 border border-green-100">
                  <dt className="text-sm font-medium text-green-600 truncate">Selected for Outreach</dt>
                  <dd className="mt-1 text-3xl font-semibold text-green-700">{outreachSelection?.length || 0}</dd>
                </div>
                <div className="px-4 py-5 bg-yellow-50 shadow rounded-lg overflow-hidden sm:p-6 border border-yellow-100">
                  <dt className="text-sm font-medium text-yellow-600 truncate">Excluded / Review</dt>
                  <dd className="mt-1 text-3xl font-semibold text-yellow-700">{run.excludedCount}</dd>
                </div>
              </dl>
              <div className="mt-4 text-xs text-gray-500 text-right">
                Engine v{run.engineVersion} | Config v{run.weightConfigurationVersion} | Ran at: {format(new Date(run.createdAt), 'PPpp')}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow sm:rounded-lg p-12 mb-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Matching History</h3>
            <p className="mt-1 text-sm text-gray-500">Run the matching engine to rank eligible vendors.</p>
          </div>
        )}

        {/* Vendors List Section */}
        {run && (
          <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-4 border-b border-gray-200 sm:px-6 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {selectedVendors.length} vendors selected
                </span>
              </div>
              <button
                onClick={handleConfirmOutreach}
                disabled={selectedVendors.length === 0 || saveOutreachMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {saveOutreachMutation.isPending ? 'Saving...' : 'Continue to Outreach'}
              </button>
            </div>
            
            {rankingsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading rankings...</div>
            ) : rankings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No vendors ranked.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outreach</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match Score</th>
                      <th className="relative px-6 py-3"><span className="sr-only">Details</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rankings.map((ev: any) => {
                      const isSelected = selectedVendors.includes(ev.vendorId);
                      const previouslySelected = outreachSelection?.find((s: any) => s.vendorId === ev.vendorId);
                      
                      return (
                      <tr key={ev.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                              checked={isSelected || !!previouslySelected}
                              disabled={!!previouslySelected}
                              onChange={() => handleToggleSelect(ev.vendorId)}
                            />
                            {previouslySelected && (
                              <span className="ml-2 text-xs text-green-600 font-medium">Selected</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          #{ev.rank}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ev.vendor.companyName}</div>
                          <div className="text-xs text-gray-500">{ev.vendor.vendorCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-xl font-bold text-blue-700 mr-2">{Math.round(ev.score)}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[120px] mt-1">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${ev.score}%` }}></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => setSelectedEvalId(ev.id)} className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full">
                            View Breakdown <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </td>
                      </tr>
                    )})}
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

      </main>

      {/* Match Breakdown Modal/Drawer */}
      {selectedEvalId && selectedEval && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedEvalId(null)}></div>
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-md">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">Match Breakdown</h2>
                      <div className="ml-3 flex h-7 items-center">
                        <button type="button" onClick={() => setSelectedEvalId(null)} className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <span className="sr-only">Close panel</span>
                          <XCircle className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">#{selectedEval.rank} - {selectedEval.vendor.companyName}</h3>
                        <p className="text-sm text-gray-500">{selectedEval.vendor.vendorCode}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-blue-600">{Math.round(selectedEval.score)}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Score</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-1 px-4 py-6 sm:px-6">
                    <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wider mb-4">Factor Breakdown</h4>
                    <ul className="space-y-6">
                      {selectedEval.factorResults.map((r: any) => {
                        const isMissing = r.status === 'NOT_AVAILABLE';
                        return (
                        <li key={r.id}>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-semibold text-gray-700">{r.factorName}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {isMissing ? 'N/A' : `${Math.round(r.normalizedScore)} / ${r.weight}`}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div 
                              className={`h-2 rounded-full ${isMissing ? 'bg-gray-300' : 'bg-blue-600'}`} 
                              style={{ width: isMissing ? '100%' : `${(r.normalizedScore / r.weight) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{r.reason}</p>
                        </li>
                      )})}
                    </ul>
                    
                    <div className="mt-8 pt-6 border-t">
                      <h4 className="text-sm font-bold text-gray-900 mb-2">Why this score?</h4>
                      <ul className="space-y-2">
                        {selectedEval.factorResults.map((r: any) => (
                          <li key={`reason-${r.id}`} className="flex items-start text-sm">
                            {r.status === 'PASS' ? (
                              <CheckSquare className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            ) : r.status === 'PARTIAL' ? (
                              <span className="text-yellow-500 mr-2 mt-0.5 font-bold">~</span>
                            ) : r.status === 'NOT_AVAILABLE' ? (
                              <span className="text-gray-400 mr-2 mt-0.5 font-bold">?</span>
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            )}
                            <span className="text-gray-700">{r.reason}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {selectedEval.factorResults.some((r:any) => r.status === 'NOT_AVAILABLE') && (
                        <div className="mt-4 bg-blue-50 text-blue-800 text-xs p-3 rounded border border-blue-100 flex items-start">
                          <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>Score has been normalized using available factors only. Missing factors did not penalize the final percentage.</span>
                        </div>
                      )}
                    </div>
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

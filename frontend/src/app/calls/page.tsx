"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { Phone, Search, FileAudio, PlayCircle, Filter } from "lucide-react";
import { format } from "date-fns";

export default function CallHistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [outcome, setOutcome] = useState("");
  
  const { data: calls, isLoading } = useQuery({
    queryKey: ['calls', page, search, status, outcome],
    queryFn: () => fetchApi(`/calls?page=${page}&limit=25&search=${search}&status=${status}&outcome=${outcome}`).then(res => res.data),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileAudio className="h-6 w-6 mr-2 text-indigo-500" /> Call History & Recording
            </h1>
            <p className="mt-1 text-sm text-gray-500">Permanent historical record of all AI vendor calls and evidence.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search Calls, Vendors, Req</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="e.g., ABC Logistics, REQ-123"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="NO_ANSWER">No Answer</option>
                <option value="BUSY">Busy</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-xs font-medium text-gray-700 mb-1">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => { setOutcome(e.target.value); setPage(1); }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              >
                <option value="">All Outcomes</option>
                <option value="QUOTE_RECEIVED">Quote Received</option>
                <option value="NOT_AVAILABLE">Not Available</option>
                <option value="CALLBACK_REQUESTED">Callback Requested</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" /> Filter
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500">Loading calls...</div>
          ) : calls?.items?.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No calls found matching criteria.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {calls?.items?.map((call: any) => (
                <li key={call.id}>
                  <Link href={`/calls/${call.id}`} className="block hover:bg-gray-50 p-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-indigo-600 truncate flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {call.callNumber}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex space-x-2">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {call.status}
                            </p>
                            {call.outcome && (
                              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${call.outcome.outcome === 'QUOTE_RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {call.outcome.outcome}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-900 font-medium">
                              {call.vendor?.companyName}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              Req: {call.requirement?.requirementNumber}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              {call.createdAt ? format(new Date(call.createdAt), 'dd MMM yyyy, HH:mm') : 'N/A'}
                              {call.durationSeconds && ` • ${Math.floor(call.durationSeconds / 60)}:${(call.durationSeconds % 60).toString().padStart(2, '0')}`}
                            </p>
                          </div>
                        </div>
                        {call.recording?.status === 'AVAILABLE' && (
                          <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                            <PlayCircle className="h-3 w-3 mr-1" /> Recording Available
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {calls?.meta?.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700 mt-2">
                    Page <span className="font-medium">{page}</span> of <span className="font-medium">{calls.meta.totalPages}</span>
                  </p>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(calls.meta.totalPages, p + 1))}
                  disabled={page === calls.meta.totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function RequirementsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ['requirements', { page, status, search }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      return fetchApi(`/requirements?${params.toString()}`);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Requirements</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and track all logistics requirements in one place.</p>
            </div>
            <button
              onClick={() => router.push("/requirements/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-600/40 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              New Requirement
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 shadow-sm sm:rounded-2xl border border-gray-200/75 flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder="Search by ID, customer name or location..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              </div>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="pl-10 appearance-none block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="READY">READY</option>
                <option value="VALIDATION_REQUIRED">VALIDATION_REQUIRED</option>
                <option value="MATCHING">MATCHING</option>
                <option value="CALLING">CALLING</option>
                <option value="QUOTATION_RECEIVED">QUOTATION_RECEIVED</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="VENDOR_SELECTED">VENDOR_SELECTED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md shadow-sm border border-gray-200/75 sm:rounded-2xl overflow-hidden mb-6">
            {isLoading ? (
              <div className="p-12 flex justify-center items-center text-gray-500">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-lg font-medium">Loading requirements...</span>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-500 flex flex-col items-center">
                <svg className="h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="font-medium text-lg">Failed to load requirements.</span>
              </div>
            ) : data?.data?.length === 0 ? (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">No requirements found</p>
                <p className="mb-6">Get started by creating a new requirement for your customers.</p>
                <button onClick={() => router.push("/requirements/new")} className="text-blue-600 font-medium hover:text-blue-700">Create your first requirement &rarr;</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requirement</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-gray-100">
                    {data?.data?.map((req: any) => (
                      <tr key={req.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => router.push(`/requirements/${req.id}`)}>
                            {req.requirementNumber}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {format(new Date(req.createdAt), 'dd MMM yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{req.customerName || '-'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{req.customerCompany || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium flex items-center">
                            {req.pickupLocation || 'TBD'} 
                            <svg className="w-4 h-4 mx-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            {req.deliveryLocation || 'TBD'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{req.pickupDate ? format(new Date(req.pickupDate), 'dd MMM yyyy') : 'No date set'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center font-medium">
                            {req.cargoType && (
                              <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                            )}
                            {req.cargoWeight ? `${req.cargoWeight} ${req.cargoWeightUnit}` : (req.cargoType || '-')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${req.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 border-gray-200' : req.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {req.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          <button onClick={() => router.push(`/requirements/${req.id}`)} className="text-blue-600 hover:text-blue-800 transition-colors opacity-80 group-hover:opacity-100">View</button>
                          <button onClick={() => router.push(`/requirements/${req.id}/edit`)} className="text-gray-500 hover:text-gray-800 transition-colors opacity-80 group-hover:opacity-100">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm px-6 py-4 border border-gray-200/75 rounded-xl shadow-sm">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700">Page {page} of {data.pagination.totalPages}</span>
              <button 
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center"
              >
                Next
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

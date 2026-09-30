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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Requirements</h1>
            <button
              onClick={() => router.push("/requirements/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              + New Requirement
            </button>
          </div>

          <div className="bg-white p-4 shadow sm:rounded-t-md border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search requirements..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-grow"
            />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
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
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-b-md">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading requirements...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">Failed to load requirements.</div>
            ) : data?.data?.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <p className="text-lg font-medium text-gray-900 mb-2">No requirements found</p>
                <p>Get started by creating a new requirement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data?.data?.map((req: any) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600 cursor-pointer" onClick={() => router.push(`/requirements/${req.id}`)}>
                            {req.requirementNumber}
                          </div>
                          <div className="text-xs text-gray-500">{format(new Date(req.createdAt), 'dd MMM yyyy')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{req.customerName || '-'}</div>
                          <div className="text-xs text-gray-500">{req.customerCompany || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{req.pickupLocation || 'TBD'} → {req.deliveryLocation || 'TBD'}</div>
                          <div className="text-xs text-gray-500">{req.pickupDate ? format(new Date(req.pickupDate), 'dd MMM yyyy') : 'No date set'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {req.cargoWeight ? `${req.cargoWeight} ${req.cargoWeightUnit}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => router.push(`/requirements/${req.id}`)} className="text-blue-600 hover:text-blue-900">View</button>
                          <button onClick={() => router.push(`/requirements/${req.id}/edit`)} className="text-gray-600 hover:text-gray-900">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center bg-white px-4 py-3 border border-gray-200 rounded-md shadow-sm">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">Page {page} of {data.pagination.totalPages}</span>
              <button 
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

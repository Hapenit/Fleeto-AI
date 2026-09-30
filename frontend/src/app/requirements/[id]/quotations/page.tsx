"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Header from "@/components/layout/Header";
import { format } from "date-fns";
import { FileText, CheckCircle, Clock, AlertCircle, Eye, IndianRupee } from "lucide-react";
import Link from "next/link";

export default function RequirementQuotationsPage() {
  const params = useParams();
  const router = useRouter();
  const requirementId = params.id as string;

  const { data: requirement, isLoading: reqLoading } = useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: () => fetchApi(`/requirements/${requirementId}`).then(res => res.data),
  });

  const { data: quotations, isLoading: quoLoading } = useQuery({
    queryKey: ['quotations', 'requirement', requirementId],
    queryFn: () => fetchApi(`/quotations?requirementId=${requirementId}`).then(res => res.data),
  });

  if (reqLoading || quoLoading) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {requirement?.requirementNumber}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Manage and view all quotations received for this requirement.
            </p>
          </div>
          <div>
            <Link 
              href={`/requirements/${requirementId}/comparison`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Compare Quotations
            </Link>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quotation</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Quote</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmed</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations?.items?.map((quo: any) => (
                <tr key={quo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{quo.quotationNumber}</div>
                        <div className="text-sm text-gray-500">v{quo.version} • {format(new Date(quo.createdAt), 'dd MMM yyyy')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{quo.vendor?.companyName}</div>
                    <div className="text-sm text-gray-500">{quo.vendor?.vendorCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1 text-gray-500" />
                      {quo.finalAmount} {quo.currency}
                    </div>
                    {quo.initialAmount !== quo.finalAmount && (
                      <div className="text-xs text-gray-400 line-through">
                        ₹{quo.initialAmount}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${quo.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                        quo.status === 'NEGOTIATED' ? 'bg-blue-100 text-blue-800' : 
                        quo.status === 'SUPERSEDED' ? 'bg-gray-100 text-gray-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {quo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quo.vendorConfirmed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/quotations/${quo.id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end">
                      <Eye className="h-4 w-4 mr-1" /> View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {(!quotations?.items || quotations.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    No quotations found for this requirement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

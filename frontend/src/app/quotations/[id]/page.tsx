"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Header from "@/components/layout/Header";
import { format } from "date-fns";
import { FileText, CheckCircle, Clock, Check, AlertTriangle, ArrowLeft, Download, ShieldCheck, Banknote, MapPin, Truck } from "lucide-react";
import Link from "next/link";

export default function QuotationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => fetchApi(`/quotations/${id}`).then(res => res.data),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center">Loading quotation...</div></div>;
  }

  if (error || !quotation) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center text-red-500">Failed to load quotation.</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-4">
          <Link href={`/requirements/${quotation.requirementId}/quotations`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Quotations
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6 border border-gray-200">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-2xl leading-6 font-bold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-indigo-500" />
                  {quotation.quotationNumber}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                  ${quotation.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                    quotation.status === 'NEGOTIATED' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                  {quotation.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Version {quotation.version}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 flex items-center mt-2">
                Created: {format(new Date(quotation.createdAt), 'dd MMM yyyy HH:mm')} 
                <span className="mx-2">•</span> 
                Requirement: <Link href={`/requirements/${quotation.requirementId}`} className="text-indigo-600 hover:underline ml-1 font-medium">{quotation.requirement?.requirementNumber}</Link>
              </p>
            </div>
            <div className="flex space-x-3">
              {quotation.status !== 'CONFIRMED' && (
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Quote
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Commercial Summary */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <Banknote className="h-5 w-5 mr-2 text-green-600" /> Commercial Summary
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Initial Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{quotation.currency} {quotation.initialAmount}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
                    <dt className="text-sm font-bold text-gray-900">Final Negotiated Amount</dt>
                    <dd className="mt-1 text-lg font-bold text-gray-900 sm:mt-0 sm:col-span-2 text-green-700">
                      {quotation.currency} {quotation.finalAmount}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Charge Breakdown Table */}
              <div className="px-6 py-4 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-3">Additional Charges Breakdown</h4>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Charge Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quotation.charges?.map((charge: any) => (
                        <tr key={charge.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">{charge.type.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium 
                              ${charge.status === 'INCLUDED' ? 'bg-green-100 text-green-800' : 
                                charge.status === 'EXTRA' ? 'bg-blue-100 text-blue-800' : 
                                charge.status === 'UNKNOWN' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {charge.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                            {charge.amount !== null ? `${quotation.currency} ${charge.amount}` : '-'}
                          </td>
                        </tr>
                      ))}
                      {(!quotation.charges || quotation.charges.length === 0) && (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">No additional charges detailed.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Delivery & Conditions */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-blue-600" /> Logistics & Conditions
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Est. Delivery Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">{quotation.estimatedDeliveryDuration || 'Unknown'}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Quote Valid Until</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {quotation.validUntil ? format(new Date(quotation.validUntil), 'dd MMM yyyy') : 'Unknown'}
                    </dd>
                  </div>
                </dl>
              </div>
              
              {quotation.conditions?.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Specific Conditions</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {quotation.conditions.map((c: any) => (
                      <li key={c.id} className="text-sm text-gray-700">{c.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            {/* Vendor Panel */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Vendor</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-md font-bold text-gray-900">{quotation.vendor?.companyName}</h4>
                <p className="text-sm text-gray-500 mb-4">{quotation.vendor?.vendorCode}</p>
                
                <div className="mt-4 flex items-center">
                  {quotation.vendorConfirmed ? (
                    <div className="flex items-center text-green-700 bg-green-50 px-3 py-2 rounded-md border border-green-200 w-full">
                      <ShieldCheck className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">Vendor Confirmed Quote</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-yellow-700 bg-yellow-50 px-3 py-2 rounded-md border border-yellow-200 w-full">
                      <Clock className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">Pending Vendor Confirmation</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence Drawer Reference */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Evidence & Source</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Source:</span>
                  <span className="text-sm font-medium text-gray-900">{quotation.source}</span>
                </div>
                {quotation.callId && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">AI Call ID:</span>
                    <Link href={`/calls/${quotation.callId}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      View Transcript
                    </Link>
                  </div>
                )}
                {quotation.negotiationId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Negotiation ID:</span>
                    <span className="text-sm font-medium text-gray-900">{quotation.negotiationId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Version History */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Version History</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {quotation.parentQuotationId ? (
                  <div className="text-sm text-gray-600">
                    This is Version {quotation.version}. Supersedes previous version.
                    <div className="mt-2">
                      <Link href={`/quotations/${quotation.parentQuotationId}`} className="text-indigo-600 hover:underline">
                        View Version {quotation.version - 1}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    This is the original version of the quotation.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

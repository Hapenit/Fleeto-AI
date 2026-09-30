"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Header from "@/components/layout/Header";
import { format } from "date-fns";
import { ShieldCheck, ArrowLeft, CheckCircle, FileText, Calendar, User, Printer } from "lucide-react";
import Link from "next/link";

export default function ConfirmedDecisionPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: decision, isLoading, error } = useQuery({
    queryKey: ['procurement-decision', id],
    queryFn: () => fetchApi(`/procurement-decisions/${id}`).then(res => res.data),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center">Loading decision record...</div></div>;
  }

  if (error || !decision) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center text-red-500">Failed to load decision.</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <div className="mb-4">
          <Link href={`/requirements/${decision.requirementId}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Requirement
          </Link>
        </div>

        {/* Certificate Header */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-start bg-green-50 border-b border-green-100">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <ShieldCheck className="h-8 w-8 text-green-600" />
                <h3 className="text-2xl leading-6 font-bold text-green-900">
                  Confirmed Procurement Decision
                </h3>
              </div>
              <p className="mt-2 text-sm text-green-800 font-medium">
                Decision ID: {decision.decisionNumber} • Status: {decision.status}
              </p>
            </div>
            <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Printer className="h-4 w-4 mr-2" /> Print Certificate
            </button>
          </div>
          
          <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Requirement Info</h4>
              <p className="text-lg font-bold text-gray-900">{decision.requirement?.requirementNumber}</p>
              <p className="text-sm text-gray-600 mt-1">{decision.requirement?.pickupCity} → {decision.requirement?.deliveryCity}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selected Vendor</h4>
              <p className="text-lg font-bold text-indigo-700">{decision.selectedVendor?.companyName}</p>
              <p className="text-sm text-gray-600 mt-1 flex items-center">
                <FileText className="h-4 w-4 mr-1" /> {decision.selectedQuotation?.quotationNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Reason & Notes */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Decision Rationale</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Reason for Selection</h4>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-100">{decision.decisionReason}</p>
                </div>
                {decision.decisionNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Additional Notes</h4>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-100">{decision.decisionNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compared Items Log */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Vendors Evaluated</h3>
              </div>
              <div className="px-4 py-5 sm:p-0">
                <ul className="divide-y divide-gray-200">
                  {decision.items?.map((item: any) => (
                    <li key={item.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        {item.decisionStatus === 'SELECTED' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-3"></div>
                        )}
                        <div>
                          <p className={`text-sm font-bold ${item.decisionStatus === 'SELECTED' ? 'text-gray-900' : 'text-gray-500'}`}>
                            Vendor ID: {item.vendorId}
                          </p>
                          <p className="text-xs text-gray-500">Quotation ID: {item.quotationId}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded ${item.decisionStatus === 'SELECTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.decisionStatus}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          <div className="space-y-6">
            
            {/* Audit Log */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Audit Trail</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Confirmed At</p>
                      <p className="text-sm text-gray-500">{decision.confirmedAt ? format(new Date(decision.confirmedAt), 'dd MMM yyyy, HH:mm:ss') : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Confirmed By</p>
                      <p className="text-sm text-gray-500">User ID: {decision.confirmedById}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">System Events</h4>
                  <ul className="space-y-3">
                    {decision.auditEntries?.map((audit: any) => (
                      <li key={audit.id} className="text-xs border-l-2 border-gray-200 pl-3">
                        <p className="font-bold text-gray-700">{audit.action}</p>
                        <p className="text-gray-500">{format(new Date(audit.createdAt), 'dd MMM yyyy, HH:mm:ss')}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}

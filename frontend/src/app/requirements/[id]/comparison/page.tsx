"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Header from "@/components/layout/Header";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Clock, ShieldCheck, XCircle, Info, Scale, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function QuotationComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const requirementId = params.id as string;
  const queryClient = useQueryClient();

  const { data: requirement, isLoading: reqLoading } = useQuery({
    queryKey: ['requirement', requirementId],
    queryFn: () => fetchApi(`/requirements/${requirementId}`).then(res => res.data),
  });

  const { data: comparison, isLoading: compLoading } = useQuery({
    queryKey: ['comparison', requirementId],
    queryFn: () => fetchApi(`/requirements/${requirementId}/comparison`).then(res => res.data),
  });

  const generateComparison = useMutation({
    mutationFn: () => fetchApi(`/requirements/${requirementId}/comparison/refresh`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Comparison snapshot generated successfully.");
      queryClient.invalidateQueries({ queryKey: ['comparison', requirementId] });
    },
    onError: () => toast.error("Failed to generate comparison.")
  });

  if (reqLoading || compLoading) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center">Loading comparison...</div></div>;
  }

  if (!comparison) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <Header />
        <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8 text-center">
          <Scale className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Comparison Snapshot</h2>
          <p className="text-gray-500 mb-6">A comparison has not been generated for this requirement yet.</p>
          <button 
            onClick={() => generateComparison.mutate()}
            disabled={generateComparison.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {generateComparison.isPending ? <RefreshCw className="animate-spin h-5 w-5 mr-2" /> : <Scale className="h-5 w-5 mr-2" />}
            Generate Comparison
          </button>
        </main>
      </div>
    );
  }

  const items = comparison.items || [];
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Navigation & Header */}
        <div className="mb-4 flex justify-between items-center">
          <Link href={`/requirements/${requirementId}/quotations`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Quotations
          </Link>
          <button 
            onClick={() => generateComparison.mutate()}
            disabled={generateComparison.isPending}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generateComparison.isPending ? 'animate-spin' : ''}`} /> 
            Refresh Snapshot
          </button>
        </div>

        <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Scale className="h-6 w-6 mr-2 text-indigo-500" /> Quotation Comparison
            </h1>
            <p className="mt-1 text-sm text-gray-500 flex items-center">
              Requirement: <span className="font-medium text-gray-900 ml-1">{requirement?.requirementNumber}</span>
              <span className="mx-2">•</span>
              Snapshot: <span className="font-medium text-gray-900 ml-1">{comparison.comparisonNumber}</span>
            </p>
          </div>
          <div>
            <Link 
              href={`/requirements/${requirementId}/procurement`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Proceed to Decision <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Fact Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Quotations Available</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{items.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Confirmed Quotations</p>
            <p className="mt-1 text-2xl font-semibold text-green-600">{items.filter((i: any) => i.vendorConfirmed).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Unknown Charges</p>
            <p className="mt-1 text-2xl font-semibold text-yellow-600">{items.filter((i: any) => i.unknownChargeCount > 0).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Requirement Mismatches</p>
            <p className="mt-1 text-2xl font-semibold text-red-600">{items.filter((i: any) => i.mismatches?.length > 0).length}</p>
          </div>
        </div>

        {/* Desktop Comparison Table */}
        <div className="hidden lg:block bg-white shadow sm:rounded-lg overflow-x-auto border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200 w-48">
                  Attribute
                </th>
                {items.map((item: any) => (
                  <th key={item.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                    <div className="font-bold text-gray-900 mb-1">{item.vendor?.companyName}</div>
                    <div className="text-gray-400 font-normal">{item.quotation?.quotationNumber}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              
              {/* Final Quote */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                  Final Quote
                </td>
                {items.map((item: any) => (
                  <td key={item.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    {item.currency} {item.finalAmount}
                  </td>
                ))}
              </tr>

              {/* Known Additional Charges */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                  Known Additional
                </td>
                {items.map((item: any) => (
                  <td key={item.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Number(item.knownAdditionalChargesAmount) > 0 
                      ? `+ ${item.currency} ${item.knownAdditionalChargesAmount}` 
                      : 'None'}
                  </td>
                ))}
              </tr>

              {/* Known Total */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  Known Total
                </td>
                {items.map((item: any) => (
                  <td key={item.id} className="px-6 py-4 whitespace-nowrap text-md text-gray-900 font-bold">
                    {item.currency} {item.knownTotalAmount}
                    {item.unknownChargeCount > 0 && <span className="text-yellow-600 ml-1">+</span>}
                  </td>
                ))}
              </tr>

              {/* Unknown Charges */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                  Unknown Charges
                </td>
                {items.map((item: any) => (
                  <td key={item.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.unknownChargeCount > 0 ? (
                      <span className="inline-flex items-center text-yellow-700 bg-yellow-50 px-2.5 py-0.5 rounded-full font-medium">
                        <AlertTriangle className="h-4 w-4 mr-1" /> {item.unknownChargeCount} fields unknown
                      </span>
                    ) : (
                      <span className="text-gray-500">0</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Delivery */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                  Delivery
                </td>
                {items.map((item: any) => {
                  const mm = item.mismatches?.find((m:any) => m.type === 'DELIVERY_DEADLINE');
                  return (
                    <td key={item.id} className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        {item.deliveryDuration || 'Unknown'}
                        {mm ? (
                          <span title="Delivery duration exceeds requirement deadline" aria-label="Delivery duration exceeds requirement deadline">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                          </span>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>

              {/* Vendor Confirmed */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                  Confirmation
                </td>
                {items.map((item: any) => (
                  <td key={item.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.vendorConfirmed ? (
                      <span className="inline-flex items-center text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full font-medium">
                        <ShieldCheck className="h-4 w-4 mr-1" /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-yellow-700 bg-yellow-50 px-2.5 py-0.5 rounded-full font-medium">
                        <Clock className="h-4 w-4 mr-1" /> Pending
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Requirement Mismatches */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-gray-200">
                  Mismatches
                </td>
                {items.map((item: any) => (
                  <td key={item.id} className="px-6 py-4 text-sm">
                    {item.mismatches?.length > 0 ? (
                      <div className="space-y-2">
                        {item.mismatches.map((m: any) => (
                          <div key={m.id} className="flex items-start text-red-600 bg-red-50 p-2 rounded text-xs border border-red-100">
                            <XCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                            <span>
                              <span className="font-bold">{m.type.replace(/_/g, ' ')}:</span> {m.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" /> All matches
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              
            </tbody>
          </table>
        </div>

        {/* Mobile View Placeholder */}
        <div className="block lg:hidden text-center p-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <Info className="h-10 w-10 text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Please use a larger screen</h3>
          <p className="text-gray-500 text-sm">The quotation comparison table is optimized for desktop viewing to compare multiple vendors side-by-side.</p>
        </div>

      </main>
    </div>
  );
}

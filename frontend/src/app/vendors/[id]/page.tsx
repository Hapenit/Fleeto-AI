"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { Building2, Phone, Mail, Globe, MapPin, CheckCircle, AlertTriangle, Truck, Package, Clock, Activity, Briefcase } from "lucide-react";

export default function VendorDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const { data: vendor, isLoading, isError } = useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const res = await fetchApi(`/vendors/${id}`);
      return res.data;
    }
  });

  const { data: user } = useQuery({ queryKey: ["user"], queryFn: async () => (await fetchApi("/auth/me")).data });

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      await fetchApi(`/vendors/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      });
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
    } catch (e) {
      alert("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading vendor...</div>;
  if (isError || !vendor) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">Failed to load vendor details.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <button onClick={() => router.push('/vendors')} className="text-sm font-medium text-gray-500 hover:text-gray-900">
            &larr; Back to Vendors
          </button>
        </div>

        {/* Vendor Header */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:justify-between md:items-start">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{vendor.companyName}</h1>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <Briefcase className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    {vendor.vendorCode}
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vendor.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      vendor.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                      vendor.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </div>
                  {vendor.callEnabled && (
                    <div className="mt-2 flex items-center text-sm text-green-600 font-medium">
                      <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-green-500" />
                      AI Calling Enabled
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <select 
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={vendor.status}
                disabled={statusUpdating || (vendor.status === 'SUSPENDED' && user?.role !== 'ADMIN')}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="ACTIVE">Mark Active</option>
                <option value="INACTIVE">Mark Inactive</option>
                <option value="PENDING_VERIFICATION">Mark Pending</option>
                {user?.role === 'ADMIN' && <option value="SUSPENDED">Suspend Vendor</option>}
              </select>
              
              <button
                onClick={() => router.push(`/vendors/${id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </button>
            </div>
          </div>
          
          <div className="border-t border-gray-200">
            <nav className="-mb-px flex px-6" aria-label="Tabs">
              {['overview', 'capabilities', 'locations', 'performance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow sm:rounded-lg">
          {activeTab === 'overview' && (
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Contact Information</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vendor.contactPersonName}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Primary Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center"><Phone className="mr-2 h-4 w-4 text-gray-400"/> {vendor.primaryPhone}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Alternate Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vendor.alternatePhone || '-'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center"><Mail className="mr-2 h-4 w-4 text-gray-400"/> {vendor.email || '-'}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Operational Settings</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Preferred Language</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vendor.preferredLanguage}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vendor.timezone}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Availability Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {vendor.availabilities?.[0]?.availabilityStatus || 'UNKNOWN'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Internal Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vendor.notes || 'None'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'capabilities' && (
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4"><Truck className="mr-2 h-5 w-5 text-gray-400" /> Vehicle Capabilities</h3>
                {vendor.vehicleCapabilities?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendor.vehicleCapabilities.map((v: any) => (
                      <div key={v.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="font-bold text-gray-900 mb-1">{v.vehicleType}</div>
                        <div className="text-sm text-gray-600 mb-2">Count: {v.vehicleCount} | Capacity: {v.maximumCapacity} {v.capacityUnit}</div>
                        {v.isPrimary && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Primary</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No vehicle capabilities recorded.</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4"><Package className="mr-2 h-5 w-5 text-gray-400" /> Cargo Capabilities</h3>
                {vendor.cargoCapabilities?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendor.cargoCapabilities.map((c: any) => (
                      <div key={c.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="font-bold text-gray-900 mb-1">{c.cargoType}</div>
                        <div className="text-sm text-gray-600 mb-2">Max: {c.maximumWeight} {c.weightUnit}</div>
                        {c.specialHandlingSupported && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Special Handling</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No cargo capabilities recorded.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4"><MapPin className="mr-2 h-5 w-5 text-gray-400" /> Physical Locations</h3>
                <ul className="space-y-4">
                  {vendor.locations?.map((l: any) => (
                    <li key={l.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">{l.city}, {l.state || ''}</span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{l.locationType}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">{l.address}</div>
                      {l.isPrimary && <div className="mt-2 text-xs text-blue-600 font-medium">Primary Location</div>}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4"><Globe className="mr-2 h-5 w-5 text-gray-400" /> Service Regions</h3>
                <ul className="space-y-4">
                  {vendor.serviceRegions?.map((sr: any) => (
                    <li key={sr.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{sr.city}, {sr.state || ''}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          sr.regionType === 'BOTH' ? 'bg-green-100 text-green-800' :
                          sr.regionType === 'PICKUP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>{sr.regionType}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="px-4 py-5 sm:p-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Performance metrics are currently populated from historical seed data. They will automatically update as vendor completes trips in future modules.
                    </p>
                  </div>
                </div>
              </div>

              {vendor.performance ? (
                <dl className="grid grid-cols-1 rounded-lg bg-white overflow-hidden shadow divide-y divide-gray-200 md:grid-cols-3 md:divide-y-0 md:divide-x border">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-base font-normal text-gray-900">Total Trips</dt>
                    <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                      <div className="flex items-baseline text-2xl font-semibold text-blue-600">
                        {vendor.performance.totalTrips}
                      </div>
                    </dd>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-base font-normal text-gray-900">Successful Trips</dt>
                    <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                      <div className="flex items-baseline text-2xl font-semibold text-green-600">
                        {vendor.performance.successfulTrips}
                      </div>
                    </dd>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-base font-normal text-gray-900">Avg Response Time</dt>
                    <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                      <div className="flex items-baseline text-2xl font-semibold text-gray-900">
                        {vendor.performance.averageResponseTimeMinutes || '-'} <span className="text-sm font-medium text-gray-500 ml-1">min</span>
                      </div>
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No performance data available.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Trash2, MapPin, Globe, Truck, Package } from "lucide-react";

export default function EditVendorPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: vendor, isLoading, isError } = useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const res = await fetchApi(`/vendors/${id}`);
      return res.data;
    }
  });

  const [formData, setFormData] = useState({
    companyName: "", businessName: "", contactPersonName: "",
    primaryPhone: "", alternatePhone: "", whatsappPhone: "",
    email: "", preferredLanguage: "EN", callEnabled: false,
    timezone: "Asia/Kolkata", notes: ""
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        companyName: vendor.companyName || "",
        businessName: vendor.businessName || "",
        contactPersonName: vendor.contactPersonName || "",
        primaryPhone: vendor.primaryPhone || "",
        alternatePhone: vendor.alternatePhone || "",
        whatsappPhone: vendor.whatsappPhone || "",
        email: vendor.email || "",
        preferredLanguage: vendor.preferredLanguage || "EN",
        callEnabled: vendor.callEnabled || false,
        timezone: vendor.timezone || "Asia/Kolkata",
        notes: vendor.notes || ""
      });
    }
  }, [vendor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchApi(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(formData) });
      if (res.success) {
        router.push(`/vendors/${id}`);
      } else {
        setError(res.message || 'Failed to update vendor');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading vendor...</div>;
  if (isError || !vendor) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500">Failed to load vendor details.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0 flex items-center">
            <button onClick={() => router.back()} className="mr-4 text-sm font-medium text-gray-500 hover:text-gray-900">&larr; Back</button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
              <Building2 className="mr-3 h-8 w-8 text-blue-600" />
              Edit Vendor: {vendor.vendorCode}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Company Information</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                <input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Contact Person *</label>
                <input required type="text" name="contactPersonName" value={formData.contactPersonName} onChange={handleInputChange} className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Primary Phone *</label>
                <input required type="text" name="primaryPhone" value={formData.primaryPhone} onChange={handleInputChange} className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

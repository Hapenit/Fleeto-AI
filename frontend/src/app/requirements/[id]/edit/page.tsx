"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";

export default function EditRequirementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reqStatus, setReqStatus] = useState<string>("");

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchApi(`/requirements/${id}`).then(res => {
      const data = res.data;
      setReqStatus(data.status);
      if (['CALLING', 'QUOTATION_RECEIVED', 'UNDER_REVIEW', 'VENDOR_SELECTED', 'COMPLETED', 'CANCELLED'].includes(data.status)) {
        alert("Cannot edit requirement in this status");
        router.push(`/requirements/${id}`);
      }
      
      // format dates for input fields
      if (data.pickupDate) data.pickupDate = data.pickupDate.split('T')[0];
      if (data.deliveryDeadline) data.deliveryDeadline = data.deliveryDeadline.split('T')[0];
      
      reset(data);
    }).catch(err => {
      setError(err.message || "Failed to load requirement");
    });
  }, [id, reset, router]);

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    setError(null);
    try {
      if (data.cargoWeight) data.cargoWeight = parseFloat(data.cargoWeight);
      if (data.cargoQuantity) data.cargoQuantity = parseInt(data.cargoQuantity, 10);
      if (data.budget) data.budget = parseFloat(data.budget);

      Object.keys(data).forEach(key => {
        if (data[key] === "") data[key] = null;
      });

      // Filter out fields that shouldn't be updated via this endpoint
      const { id: _, requirementNumber, createdById, createdAt, updatedAt, status, createdBy, statusHistory, validationResult, ...updateData } = data;

      await fetchApi(`/requirements/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      router.push(`/requirements/${id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update requirement");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Requirement</h1>
          <button type="button" onClick={() => router.back()} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-md shadow-sm border border-red-200">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Section 1 - Customer */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">1. Customer Information</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                <input {...register("customerName")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input {...register("customerCompany")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
          </div>

          {/* Section 2 - Route */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">2. Route & Schedule</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Location *</label>
                <input {...register("pickupLocation")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Location *</label>
                <input {...register("deliveryLocation")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Date *</label>
                <input type="date" {...register("pickupDate")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Deadline</label>
                <input type="date" {...register("deliveryDeadline")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
          </div>

          {/* Section 3 - Cargo & Vehicle */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
              <h3 className="text-lg leading-6 font-medium text-gray-900">3. Cargo & Vehicle</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo Type *</label>
                <input {...register("cargoType")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Type *</label>
                <select {...register("vehicleType")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                  <option value="">Select...</option>
                  <option value="TRUCK">TRUCK</option>
                  <option value="MINI_TRUCK">MINI_TRUCK</option>
                  <option value="LORRY">LORRY</option>
                  <option value="TRAILER">TRAILER</option>
                  <option value="CONTAINER">CONTAINER</option>
                  <option value="TANKER">TANKER</option>
                  <option value="TEMPO">TEMPO</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Weight *</label>
                  <input type="number" step="0.01" {...register("cargoWeight")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select {...register("cargoWeightUnit")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                    <option value="TON">TON</option>
                    <option value="KG">KG</option>
                    <option value="GRAM">GRAM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button 
              type="button"
              onClick={() => router.back()}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 focus:outline-none transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

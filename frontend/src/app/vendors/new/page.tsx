"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Building2, Truck, Package, MapPin, Globe } from "lucide-react";

export default function NewVendorPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: "", businessName: "", contactPersonName: "",
    primaryPhone: "", alternatePhone: "", whatsappPhone: "",
    email: "", preferredLanguage: "EN", callEnabled: false,
    timezone: "Asia/Kolkata", notes: ""
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [serviceRegions, setServiceRegions] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const addLocation = () => setLocations([...locations, { city: "", locationType: "OFFICE" }]);
  const addServiceRegion = () => setServiceRegions([...serviceRegions, { city: "", regionType: "BOTH" }]);
  const addVehicle = () => setVehicles([...vehicles, { vehicleType: "", maximumCapacity: 0, capacityUnit: "TON", vehicleCount: 1 }]);
  const addCargo = () => setCargos([...cargos, { cargoType: "", maximumWeight: 0, weightUnit: "TON" }]);

  const updateItem = (setter: any, index: number, field: string, value: any) => {
    setter((prev: any[]) => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const removeItem = (setter: any, index: number) => {
    setter((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        locations: locations.length > 0 ? locations : undefined,
        serviceRegions: serviceRegions.length > 0 ? serviceRegions : undefined,
        vehicleCapabilities: vehicles.length > 0 ? vehicles.map(v => ({...v, maximumCapacity: Number(v.maximumCapacity), vehicleCount: Number(v.vehicleCount)})) : undefined,
        cargoCapabilities: cargos.length > 0 ? cargos.map(c => ({...c, maximumWeight: Number(c.maximumWeight)})) : undefined,
      };

      const res = await fetchApi('/vendors', { method: 'POST', body: JSON.stringify(payload) });
      if (res.success) {
        router.push(`/vendors/${res.data.id}`);
      } else {
        setError(res.message || 'Failed to create vendor');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
              <Building2 className="mr-3 h-8 w-8 text-blue-600" />
              Add New Vendor
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
                <label className="block text-sm font-medium text-gray-700">Primary Phone * (e.g. +919876543210)</label>
                <input required type="text" name="primaryPhone" value={formData.primaryPhone} onChange={handleInputChange} className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border" />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Communication</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Preferred Language</label>
                <select name="preferredLanguage" value={formData.preferredLanguage} onChange={handleInputChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="EN">English</option>
                  <option value="TA">Tamil</option>
                  <option value="TA_EN">Tanglish</option>
                  <option value="HI">Hindi</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex items-center mt-6">
                <input type="checkbox" name="callEnabled" checked={formData.callEnabled} onChange={handleInputChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label className="ml-2 block text-sm text-gray-900">Enable AI Calling for this Vendor</label>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center"><MapPin className="mr-2 h-5 w-5 text-gray-500"/> Locations</h3>
              <button type="button" onClick={addLocation} className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center"><Plus className="h-4 w-4 mr-1"/> Add</button>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {locations.map((loc, i) => (
                <div key={i} className="flex gap-4 items-center mb-4">
                  <input type="text" placeholder="City" value={loc.city} onChange={(e) => updateItem(setLocations, i, 'city', e.target.value)} className="flex-1 py-2 px-3 border rounded-md" required />
                  <select value={loc.locationType} onChange={(e) => updateItem(setLocations, i, 'locationType', e.target.value)} className="py-2 px-3 border rounded-md">
                    <option value="OFFICE">Office</option>
                    <option value="YARD">Yard</option>
                    <option value="DEPOT">Depot</option>
                    <option value="GARAGE">Garage</option>
                  </select>
                  <button type="button" onClick={() => removeItem(setLocations, i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5"/></button>
                </div>
              ))}
              {locations.length === 0 && <p className="text-sm text-gray-500">No locations added.</p>}
            </div>
          </div>

          {/* Service Regions */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center"><Globe className="mr-2 h-5 w-5 text-gray-500"/> Service Regions</h3>
              <button type="button" onClick={addServiceRegion} className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center"><Plus className="h-4 w-4 mr-1"/> Add</button>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {serviceRegions.map((loc, i) => (
                <div key={i} className="flex gap-4 items-center mb-4">
                  <input type="text" placeholder="City" value={loc.city} onChange={(e) => updateItem(setServiceRegions, i, 'city', e.target.value)} className="flex-1 py-2 px-3 border rounded-md" required />
                  <select value={loc.regionType} onChange={(e) => updateItem(setServiceRegions, i, 'regionType', e.target.value)} className="py-2 px-3 border rounded-md">
                    <option value="BOTH">Both (Pickup & Delivery)</option>
                    <option value="PICKUP">Pickup Only</option>
                    <option value="DELIVERY">Delivery Only</option>
                  </select>
                  <button type="button" onClick={() => removeItem(setServiceRegions, i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5"/></button>
                </div>
              ))}
              {serviceRegions.length === 0 && <p className="text-sm text-gray-500">No service regions added.</p>}
            </div>
          </div>

          {/* Vehicle Capabilities */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center"><Truck className="mr-2 h-5 w-5 text-gray-500"/> Vehicle Capabilities</h3>
              <button type="button" onClick={addVehicle} className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center"><Plus className="h-4 w-4 mr-1"/> Add</button>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {vehicles.map((v, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 items-center mb-4 border p-4 rounded-md">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Vehicle Type</label>
                    <input type="text" placeholder="e.g. Trailer" value={v.vehicleType} onChange={(e) => updateItem(setVehicles, i, 'vehicleType', e.target.value)} className="w-full py-2 px-3 border rounded-md" required />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Max Capacity (TON)</label>
                    <input type="number" value={v.maximumCapacity} onChange={(e) => updateItem(setVehicles, i, 'maximumCapacity', e.target.value)} className="w-full py-2 px-3 border rounded-md" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Count</label>
                    <input type="number" min="1" value={v.vehicleCount} onChange={(e) => updateItem(setVehicles, i, 'vehicleCount', e.target.value)} className="w-full py-2 px-3 border rounded-md" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeItem(setVehicles, i)} className="text-red-500 hover:text-red-700 mt-5"><Trash2 className="h-5 w-5"/></button>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && <p className="text-sm text-gray-500">No vehicles added.</p>}
            </div>
          </div>

          {/* Cargo Capabilities */}
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center"><Package className="mr-2 h-5 w-5 text-gray-500"/> Cargo Capabilities</h3>
              <button type="button" onClick={addCargo} className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center"><Plus className="h-4 w-4 mr-1"/> Add</button>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {cargos.map((c, i) => (
                <div key={i} className="flex gap-4 items-center mb-4">
                  <input type="text" placeholder="Cargo Type (e.g. Industrial)" value={c.cargoType} onChange={(e) => updateItem(setCargos, i, 'cargoType', e.target.value)} className="flex-1 py-2 px-3 border rounded-md" required />
                  <input type="number" placeholder="Max Weight (TON)" value={c.maximumWeight} onChange={(e) => updateItem(setCargos, i, 'maximumWeight', e.target.value)} className="w-32 py-2 px-3 border rounded-md" />
                  <button type="button" onClick={() => removeItem(setCargos, i)} className="text-red-500 hover:text-red-700"><Trash2 className="h-5 w-5"/></button>
                </div>
              ))}
              {cargos.length === 0 && <p className="text-sm text-gray-500">No cargo capabilities added.</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

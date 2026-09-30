"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Sparkles, ArrowRight, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

export default function NewRequirementPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'CHOICE' | 'MANUAL' | 'AI'>('CHOICE');
  const [aiText, setAiText] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiExtractionId, setAiExtractionId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any, isDraft: boolean = true) => {
    setIsSaving(true);
    setError(null);
    try {
      if (data.cargoWeight) data.cargoWeight = parseFloat(data.cargoWeight);
      if (data.cargoQuantity) data.cargoQuantity = parseInt(data.cargoQuantity, 10);
      if (data.budget) data.budget = parseFloat(data.budget);

      Object.keys(data).forEach(key => {
        if (data[key] === "") data[key] = undefined;
      });

      if (aiExtractionId) {
        // Apply AI extraction
        const res = await fetchApi(`/ai/requirements/extractions/${aiExtractionId}/apply`, {
          method: "POST",
          body: JSON.stringify({ acceptedFields: data }),
        });
        router.push(`/requirements/${res.data.requirementId || res.data.id}`);
      } else {
        // Manual save
        const res = await fetchApi("/requirements", {
          method: "POST",
          body: JSON.stringify(data),
        });
        router.push(`/requirements/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save requirement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiExtract = async () => {
    if (!aiText.trim()) return;
    setIsAiProcessing(true);
    setError(null);
    try {
      const res = await fetchApi("/ai/requirements/extract", {
        method: "POST",
        body: JSON.stringify({ inputText: aiText }),
      });
      setAiResult(res.data);
      setAiExtractionId(res.data.id);
      
      const formValues = { ...res.data.extractedData };
      if (formValues.pickupDate) formValues.pickupDate = formValues.pickupDate.split('T')[0];
      if (formValues.deliveryDeadline) formValues.deliveryDeadline = formValues.deliveryDeadline.split('T')[0];
      reset(formValues);
    } catch (err: any) {
      setError(err.message || "Failed to extract requirement using AI. Please try again.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (mode === 'CHOICE') {
    return (
      <div className="min-h-screen bg-gray-50 pb-12">
        <Header />
        <main className="max-w-5xl mx-auto py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-10">How would you like to create the requirement?</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div 
              onClick={() => setMode('MANUAL')}
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col items-center text-center"
            >
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Entry</h3>
              <p className="text-gray-500 mb-6">Fill out the requirement form fields yourself manually.</p>
              <span className="text-blue-600 font-medium inline-flex items-center">Get Started <ArrowRight className="ml-2 h-4 w-4" /></span>
            </div>

            <div 
              onClick={() => setMode('AI')}
              className="bg-white p-8 rounded-xl shadow-sm border border-purple-200 cursor-pointer hover:border-purple-500 hover:shadow-md transition-all flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-bl-lg">RECOMMENDED</div>
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Describe with AI</h3>
              <p className="text-gray-500 mb-6">Type a natural language description and let AI extract the details for you.</p>
              <span className="text-purple-600 font-medium inline-flex items-center">Try AI Assistant <ArrowRight className="ml-2 h-4 w-4" /></span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Requirement</h1>
          <button type="button" onClick={() => setMode('CHOICE')} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Back
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-md shadow-sm border border-red-200">
            {error}
          </div>
        )}

        {mode === 'AI' && !aiResult && (
          <div className="bg-white shadow sm:rounded-lg overflow-hidden mb-8 border border-purple-200">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-purple-50 flex items-center">
              <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">AI Requirement Assistant</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Describe the customer's requirement:</label>
              <textarea 
                rows={5}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-purple-500 focus:border-purple-500"
                placeholder="E.g. Customer ABC Industries wants to transport an 18 ton industrial machine from Chennai to Bangalore next Monday. They need a trailer..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                disabled={isAiProcessing}
              ></textarea>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAiExtract}
                  disabled={isAiProcessing || !aiText.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {isAiProcessing ? (
                    <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Understanding requirement...</>
                  ) : (
                    <><Sparkles className="-ml-1 mr-2 h-4 w-4" /> Extract Requirement</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {aiResult && (
          <div className="mb-8">
            <div className="bg-white p-6 shadow sm:rounded-lg border border-purple-200 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                <CheckCircle className="text-green-500 h-5 w-5 mr-2" />
                AI Extraction Complete
              </h3>
              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded border"><strong>Summary:</strong> {aiResult.summary}</p>
              
              {aiResult.missingFields?.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Information Required</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {aiResult.missingFields.map((field: string) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-500">Please review the extracted information below and fill in any missing details before applying.</p>
            </div>
          </div>
        )}

        {(mode === 'MANUAL' || aiResult) && (
          <form className="space-y-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input {...register("customerPhone")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" {...register("customerEmail")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
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
                
                <div className="sm:col-span-2">
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="flex items-center">
                      <input type="checkbox" {...register("specialHandlingRequired")} className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-4 w-4" />
                      <span className="ml-2 text-sm text-gray-700">Special Handling Required</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" {...register("loadingRequired")} className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-4 w-4" />
                      <span className="ml-2 text-sm text-gray-700">Loading Required</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" {...register("unloadingRequired")} className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-4 w-4" />
                      <span className="ml-2 text-sm text-gray-700">Unloading Required</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 - Commercial & Notes */}
            <div className="bg-white shadow sm:rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">4. Commercial & Notes</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Budget</label>
                    <input type="number" step="0.01" {...register("budget")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select {...register("budgetCurrency")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea rows={3} {...register("additionalNotes")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button 
                type="button"
                disabled={isSaving}
                onClick={handleSubmit((data) => onSubmit(data, true))}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {aiResult ? 'Save Draft' : 'Save Draft'}
              </button>
              <button 
                type="button"
                disabled={isSaving}
                onClick={handleSubmit((data) => onSubmit(data, false))}
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {aiResult ? 'Apply All & Continue' : 'Save & Continue'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

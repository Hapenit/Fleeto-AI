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
          <form className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section 1 - Customer */}
            <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/75 sm:rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="px-6 py-5 border-b border-gray-100 bg-white/50">
                <h3 className="text-lg leading-6 font-semibold text-gray-800 tracking-tight flex items-center">
                  <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full inline-flex items-center justify-center text-xs mr-3">1</span>
                  Customer Information
                </h3>
              </div>
              <div className="px-6 py-6 sm:p-8 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name <span className="text-red-500">*</span></label>
                  <input {...register("customerName")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input {...register("customerCompany")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input {...register("customerPhone")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" {...register("customerEmail")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="contact@acme.com" />
                </div>
              </div>
            </div>

            {/* Section 2 - Route */}
            <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/75 sm:rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="px-6 py-5 border-b border-gray-100 bg-white/50">
                <h3 className="text-lg leading-6 font-semibold text-gray-800 tracking-tight flex items-center">
                  <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full inline-flex items-center justify-center text-xs mr-3">2</span>
                  Route & Schedule
                </h3>
              </div>
              <div className="px-6 py-6 sm:p-8 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Location <span className="text-red-500">*</span></label>
                  <input {...register("pickupLocation")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="City or Zip" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Location <span className="text-red-500">*</span></label>
                  <input {...register("deliveryLocation")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="City or Zip" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pickup Date <span className="text-red-500">*</span></label>
                  <input type="date" {...register("pickupDate")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Deadline</label>
                  <input type="date" {...register("deliveryDeadline")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" />
                </div>
              </div>
            </div>

            {/* Section 3 - Cargo & Vehicle */}
            <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/75 sm:rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="px-6 py-5 border-b border-gray-100 bg-white/50">
                <h3 className="text-lg leading-6 font-semibold text-gray-800 tracking-tight flex items-center">
                  <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full inline-flex items-center justify-center text-xs mr-3">3</span>
                  Cargo & Vehicle
                </h3>
              </div>
              <div className="px-6 py-6 sm:p-8 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cargo Type <span className="text-red-500">*</span></label>
                  <input {...register("cargoType")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="e.g. Industrial Machinery" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle Type <span className="text-red-500">*</span></label>
                  <div className="relative mt-1.5">
                    <select {...register("vehicleType")} className="appearance-none block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200">
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Weight <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" {...register("cargoWeight")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="0.00" />
                  </div>
                  <div className="w-28">
                    <label className="block text-sm font-medium text-gray-700">Unit</label>
                    <div className="relative mt-1.5">
                      <select {...register("cargoWeightUnit")} className="appearance-none block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200">
                        <option value="TON">TON</option>
                        <option value="KG">KG</option>
                        <option value="GRAM">GRAM</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="sm:col-span-2 mt-2">
                  <div className="flex flex-wrap gap-4">
                    <label className="relative flex cursor-pointer items-center rounded-full p-2 hover:bg-gray-50">
                      <input type="checkbox" {...register("specialHandlingRequired")} className="peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-500 checked:bg-blue-600 hover:scale-105" />
                      <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 select-none">Special Handling Required</span>
                    </label>
                    <label className="relative flex cursor-pointer items-center rounded-full p-2 hover:bg-gray-50">
                      <input type="checkbox" {...register("loadingRequired")} className="peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-500 checked:bg-blue-600 hover:scale-105" />
                      <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 select-none">Loading Required</span>
                    </label>
                    <label className="relative flex cursor-pointer items-center rounded-full p-2 hover:bg-gray-50">
                      <input type="checkbox" {...register("unloadingRequired")} className="peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-blue-500 checked:bg-blue-600 hover:scale-105" />
                      <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 select-none">Unloading Required</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 - Commercial & Notes */}
            <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/75 sm:rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="px-6 py-5 border-b border-gray-100 bg-white/50">
                <h3 className="text-lg leading-6 font-semibold text-gray-800 tracking-tight flex items-center">
                  <span className="bg-blue-100 text-blue-700 h-6 w-6 rounded-full inline-flex items-center justify-center text-xs mr-3">4</span>
                  Commercial & Notes
                </h3>
              </div>
              <div className="px-6 py-6 sm:p-8 grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Budget</label>
                    <input type="number" step="0.01" {...register("budget")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="Optional" />
                  </div>
                  <div className="w-28">
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <div className="relative mt-1.5">
                      <select {...register("budgetCurrency")} className="appearance-none block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200">
                        <option value="INR">INR</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                  <textarea rows={3} {...register("additionalNotes")} className="mt-1.5 block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all duration-200" placeholder="Any special instructions or details..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 pb-10">
              <button 
                type="button"
                disabled={isSaving}
                onClick={handleSubmit((data) => onSubmit(data, true))}
                className="bg-white border border-gray-200 shadow-sm text-gray-700 px-8 py-2.5 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                {aiResult ? 'Save Draft' : 'Save Draft'}
              </button>
              <button 
                type="button"
                disabled={isSaving}
                onClick={handleSubmit((data) => onSubmit(data, false))}
                className="bg-blue-600 text-white shadow-md shadow-blue-500/30 px-8 py-2.5 rounded-xl font-medium hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 flex items-center"
              >
                {isSaving && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                {aiResult ? 'Apply All & Continue' : 'Save & Continue'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

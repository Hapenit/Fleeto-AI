"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { fetchApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, AlertCircle, RefreshCw } from "lucide-react";

type MatchingConfig = {
  version?: string;
  routeWeight?: number;
  vehicleWeight?: number;
  capacityWeight?: number;
  cargoWeight?: number;
  availabilityWeight?: number;
  serviceCoverageWeight?: number;
  performanceWeight?: number;
  commercialWeight?: number;
  communicationWeight?: number;
};

type WeightKey = keyof Omit<MatchingConfig, "version">;

export default function MatchingConfigurationPage() {
  const queryClient = useQueryClient();

  const { data: configResp, isLoading } = useQuery<MatchingConfig>({
    queryKey: ["matching-config"],
    queryFn: async () => (await fetchApi(`/admin/matching/configuration`)).data as MatchingConfig
  });

  const updateMutation = useMutation({
    mutationFn: async (weights: Record<WeightKey, number>) => {
      return await fetchApi(`/admin/matching/configuration`, {
        method: "POST",
        body: JSON.stringify(weights)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matching-config"] });
      alert("Configuration updated successfully!");
    },
    onError: (err: Error) => {
      alert(err.message || "Failed to update configuration.");
    }
  });

  const [weights, setWeights] = useState<Record<WeightKey, number>>({
    routeWeight: configResp?.routeWeight ?? 25,
    vehicleWeight: configResp?.vehicleWeight ?? 20,
    capacityWeight: configResp?.capacityWeight ?? 15,
    cargoWeight: configResp?.cargoWeight ?? 10,
    availabilityWeight: configResp?.availabilityWeight ?? 10,
    serviceCoverageWeight: configResp?.serviceCoverageWeight ?? 5,
    performanceWeight: configResp?.performanceWeight ?? 10,
    commercialWeight: configResp?.commercialWeight ?? 3,
    communicationWeight: configResp?.communicationWeight ?? 2,
  });

  useEffect(() => {
    if (!configResp) return;

    setWeights({
      routeWeight: configResp.routeWeight ?? 25,
      vehicleWeight: configResp.vehicleWeight ?? 20,
      capacityWeight: configResp.capacityWeight ?? 15,
      cargoWeight: configResp.cargoWeight ?? 10,
      availabilityWeight: configResp.availabilityWeight ?? 10,
      serviceCoverageWeight: configResp.serviceCoverageWeight ?? 5,
      performanceWeight: configResp.performanceWeight ?? 10,
      commercialWeight: configResp.commercialWeight ?? 3,
      communicationWeight: configResp.communicationWeight ?? 2,
    });
  }, [configResp]);

  const handleChange = (key: WeightKey, value: string) => {
    setWeights(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);

  const handleSave = () => {
    if (Math.abs(totalWeight - 100) > 0.01) {
      alert("Total weight must equal exactly 100.");
      return;
    }
    updateMutation.mutate(weights);
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading configuration...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
        
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Matching Configuration
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure the weights used by the Vendor Ranking Engine. Total must equal 100. Current Version: {configResp?.version || '1.0'}
            </p>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            
            <div className={`mb-6 p-4 rounded-md flex items-start ${Math.abs(totalWeight - 100) > 0.01 ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium">Total Weight: {totalWeight.toFixed(1)}%</h3>
                {Math.abs(totalWeight - 100) > 0.01 && (
                  <p className="text-sm mt-1">Weights must total exactly 100% to save.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {(Object.keys(weights) as WeightKey[]).map((key) => {
                const value = weights[key];
                const label = key.replace('Weight', '').replace(/([A-Z])/g, ' $1').trim();
                const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

                return (
                  <div key={key} className="flex items-center">
                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 w-1/3">
                      {displayLabel} Match
                    </label>
                    <div className="mt-1 w-2/3 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="ml-4 w-20 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                      />
                      <span className="ml-2 text-sm text-gray-500">%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 border-t pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={Math.abs(totalWeight - 100) > 0.01 || updateMutation.isPending}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {updateMutation.isPending ? <RefreshCw className="animate-spin h-5 w-5" /> : <><Save className="-ml-1 mr-2 h-5 w-5" /> Save Configuration</>}
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

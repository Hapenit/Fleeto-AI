"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Phone, FileAudio, PlayCircle, Download, FileText, CheckCircle, AlertTriangle, ShieldCheck, Clock, ListOrdered, Navigation, ArrowRight } from "lucide-react";

export default function CallDetailsPage() {
  const params = useParams();
  const callId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['call-details', callId],
    queryFn: () => fetchApi(`/calls/${callId}`).then(res => res.data),
  });

  const { data: access } = useQuery({
    queryKey: ['call-recording-access', callId],
    queryFn: () => fetchApi(`/calls/${callId}/recording/access`).then(res => res.data),
    enabled: !!data?.recording && data.recording.status === 'AVAILABLE',
  });

  const { data: transcriptData } = useQuery({
    queryKey: ['call-transcript', callId],
    queryFn: () => fetchApi(`/calls/${callId}/transcript`).then(res => res.data),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['call-events', callId],
    queryFn: () => fetchApi(`/calls/${callId}/events`).then(res => res.data),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center">Loading call details...</div></div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-gray-50"><Header /><div className="p-10 text-center text-red-500">Call not found</div></div>;
  }

  const { call, vendor, requirement, recording, extraction, outcome, analysis, quotation, negotiation, procurementDecision } = data;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <div className="mb-4">
          <Link href="/calls" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Call History
          </Link>
        </div>

        {/* Header section */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-start bg-gray-50 border-b border-gray-200">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <Phone className="h-6 w-6 text-gray-500" />
                <h3 className="text-xl leading-6 font-bold text-gray-900">
                  {call.callNumber}
                </h3>
                <span className="px-2 py-1 text-xs font-bold rounded bg-gray-200 text-gray-800">
                  {call.status}
                </span>
                {outcome && (
                  <span className={`px-2 py-1 text-xs font-bold rounded ${outcome.outcome === 'QUOTE_RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {outcome.outcome}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600 font-medium">
                <Link href={`/vendors/${vendor?.id}`} className="text-indigo-600 hover:underline">{vendor?.companyName}</Link> • <Link href={`/requirements/${requirement?.id}`} className="text-indigo-600 hover:underline">{requirement?.requirementNumber}</Link>
              </p>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Started At</h4>
              <p className="text-sm font-medium text-gray-900">{call.startedAt ? format(new Date(call.startedAt), 'dd MMM yyyy, HH:mm:ss') : 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Duration</h4>
              <p className="text-sm font-medium text-gray-900">
                {call.durationSeconds ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s` : 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Language</h4>
              <p className="text-sm font-medium text-gray-900">{call.language}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recording</h4>
              <p className="text-sm font-medium text-gray-900 flex items-center">
                {recording?.status === 'AVAILABLE' ? (
                  <span className="text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-1" /> Available</span>
                ) : (
                  <span className="text-gray-500 flex items-center"><AlertTriangle className="h-4 w-4 mr-1" /> {recording?.status || 'Unavailable'}</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Recording Player */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <FileAudio className="h-5 w-5 mr-2 text-indigo-500" /> Audio Recording
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6 text-center">
                {recording?.status === 'AVAILABLE' && access?.url ? (
                  <audio controls className="w-full" src={access.url}>
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <div className="py-6 text-sm text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                    No recording available for this call.
                  </div>
                )}
              </div>
            </div>

            {/* Transcript */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-500" /> Transcript
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-0 max-h-[600px] overflow-y-auto bg-gray-50">
                {transcriptData?.items?.length > 0 ? (
                  <div className="space-y-4 p-4">
                    {transcriptData.items.map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.speaker === 'AI' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm border ${
                          msg.speaker === 'AI' ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none' : 'bg-white text-gray-900 border-gray-200 rounded-tl-none'
                        }`}>
                          <p className="text-sm font-bold opacity-75 mb-1">{msg.speaker === 'AI' ? 'Fleeto AI' : vendor?.companyName}</p>
                          <p className="text-sm">{msg.text}</p>
                          {msg.confidence && msg.confidence < 0.8 && (
                            <p className="text-xs opacity-50 mt-1 flex items-center"><AlertTriangle className="h-3 w-3 mr-1"/> Low confidence ({Math.round(msg.confidence * 100)}%)</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center text-sm text-gray-500">
                    Transcript unavailable for this call.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Extraction */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Extracted Information</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {extraction ? (
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Vendor Available</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">{extraction.vendorAvailable ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Vehicle Available</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">{extraction.vehicleAvailable ? 'Yes' : 'No'}</dd>
                    </div>
                    {extraction.quotedAmount && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">Quoted Amount</dt>
                        <dd className="mt-1 text-lg font-bold text-green-700">{extraction.currency || 'INR'} {extraction.quotedAmount}</dd>
                      </div>
                    )}
                    {extraction.vendorConditions && (
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase">Conditions</dt>
                        <dd className="mt-1 text-sm text-gray-900">{extraction.vendorConditions}</dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="text-sm text-gray-500 italic">No structured extraction available.</p>
                )}
              </div>
            </div>

            {/* Relations Panel */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Related Artifacts</h3>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-gray-100">
                  {analysis && (
                    <li className="p-4 hover:bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Analysis</p>
                        <p className="text-xs text-gray-500">Interest: {analysis.interestLevel}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </li>
                  )}
                  {negotiation && (
                    <li className="p-4 hover:bg-gray-50 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-gray-900">Negotiation</p>
                        <p className="text-xs text-gray-500">{negotiation.status}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </li>
                  )}
                  {quotation && (
                    <li className="p-4 hover:bg-gray-50">
                      <Link href={`/quotations/${quotation.id}`} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900 flex items-center"><FileText className="h-4 w-4 mr-1 text-indigo-500" /> Quotation</p>
                          <p className="text-xs text-gray-500">{quotation.quotationNumber}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </li>
                  )}
                  {procurementDecision && (
                    <li className="p-4 hover:bg-gray-50">
                      <Link href={`/procurement-decisions/${procurementDecision.id}`} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900 flex items-center"><ShieldCheck className="h-4 w-4 mr-1 text-green-500" /> Procurement</p>
                          <p className="text-xs text-gray-500">{procurementDecision.decisionNumber}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </Link>
                    </li>
                  )}
                  {!analysis && !quotation && !procurementDecision && (
                    <li className="p-4 text-sm text-gray-500 text-center italic">No related artifacts created yet.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white shadow sm:rounded-lg border border-gray-200">
              <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <ListOrdered className="h-5 w-5 mr-2 text-indigo-500" /> Call Timeline
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6 max-h-[400px] overflow-y-auto">
                {eventsData?.length > 0 ? (
                  <div className="relative border-l border-gray-200 ml-3 space-y-4">
                    {eventsData.map((event: any) => (
                      <div key={event.id} className="relative pl-6">
                        <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-indigo-600 bg-white"></div>
                        <p className="text-xs font-bold text-gray-500">{format(new Date(event.timestamp), 'HH:mm:ss')}</p>
                        <p className="text-sm text-gray-900">{event.eventType}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No timeline events recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

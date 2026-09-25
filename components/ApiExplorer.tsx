'use client';

import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, ExternalLink, RefreshCw, Code2, Server } from 'lucide-react';

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  category: string;
  description: string;
  defaultHeaders?: Record<string, string>;
  defaultBody?: any;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'health',
    method: 'GET',
    path: '/api/v1/health',
    category: 'System Health',
    description: 'Periksa kesiapan konektivitas database PostgreSQL, Redis cache, BullMQ queue, dan memory runtime.',
  },
  {
    id: 'destinations-list',
    method: 'GET',
    path: '/api/v1/destinations',
    category: 'Destinations',
    description: 'Ambil daftar seluruh destinasi wisata Nusantara beserta cuaca, rating, dan metadata kota.',
  },
  {
    id: 'packages-list',
    method: 'GET',
    path: '/api/v1/packages',
    category: 'Travel Packages',
    description: 'Ambil katalog paket perjalanan wisata lengkap dengan itinerary, inclusions, dan harga.',
  },
  {
    id: 'schedules-list',
    method: 'GET',
    path: '/api/v1/schedules',
    category: 'Inventory & Schedules',
    description: 'Ambil ketersediaan jadwal keberangkatan dan sisa kuota kursi (atomic quota snapshot).',
  },
  {
    id: 'bookings-list',
    method: 'GET',
    path: '/api/v1/bookings',
    category: 'Bookings & Orders',
    description: 'Dapatkan daftar seluruh pesanan reservasi, status tiket, dan invoice.',
  },
  {
    id: 'bookings-create',
    method: 'POST',
    path: '/api/v1/bookings',
    category: 'Bookings & Orders',
    description: 'Buat reservasi baru dengan atomic lock mutex untuk menjamin tidak terjadi overselling kursi.',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Idempotency-Key': 'idem-req-' + Date.now(),
    },
    defaultBody: {
      userId: 'usr_cust_001',
      packageId: 'pkg_bali_001',
      scheduleId: 'sch_bali_01',
      travelers: [
        {
          fullName: 'Bambang Pamungkas',
          type: 'ADULT',
          gender: 'MALE',
          dateOfBirth: '1985-06-10',
          nationality: 'Indonesian',
          identityNumber: '3273011006850002',
          phone: '+6281299887766',
          email: 'bambang@example.com',
          specialRequest: 'Vegetarian meals on flight',
        },
      ],
      paymentMethod: 'BCA_VA',
    },
  },
  {
    id: 'payments-create',
    method: 'POST',
    path: '/api/v1/payments',
    category: 'Payment Gateway',
    description: 'Proses konfirmasi pembayaran transaksi dengan verifikasi Idempotency-Key unik.',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Idempotency-Key': 'pay-idem-' + Date.now(),
    },
    defaultBody: {
      bookingId: 'book_demo_001',
      paymentMethod: 'BCA_VA',
      amount: 19480000,
    },
  },
  {
    id: 'refunds-list',
    method: 'GET',
    path: '/api/v1/refunds',
    category: 'Refunds & Cancellations',
    description: 'Daftar permohonan refund dan pembatalan tiket pelanggan.',
  },
  {
    id: 'analytics-dashboard',
    method: 'GET',
    path: '/api/v1/analytics/dashboard',
    category: 'Analytics & Reporting',
    description: 'Statistik pendapatan, tingkat okupansi kursi, dan tren pemesanan real-time.',
  },
  {
    id: 'audit-logs',
    method: 'GET',
    path: '/api/v1/audit-logs',
    category: 'Audit & Compliance',
    description: 'Log forensik audit immutable seluruh mutasi data kritis sistem.',
  },
];

export function ApiExplorer() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0]);
  const [requestHeaders, setRequestHeaders] = useState<string>(
    JSON.stringify(selectedEndpoint.defaultHeaders || { 'Content-Type': 'application/json' }, null, 2)
  );
  const [requestBody, setRequestBody] = useState<string>(
    selectedEndpoint.defaultBody ? JSON.stringify(selectedEndpoint.defaultBody, null, 2) : ''
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelectedEndpoint(ep);
    setRequestHeaders(JSON.stringify(ep.defaultHeaders || { 'Content-Type': 'application/json' }, null, 2));
    setRequestBody(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseStatus(null);
    setResponseData(null);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    const start = performance.now();

    try {
      let headersObj: Record<string, string> = {};
      try {
        if (requestHeaders.trim()) headersObj = JSON.parse(requestHeaders);
      } catch {
        headersObj = { 'Content-Type': 'application/json' };
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: headersObj,
      };

      if (selectedEndpoint.method !== 'GET' && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const latency = Math.round(performance.now() - start);
      setResponseLatency(latency);
      setResponseStatus(res.status);

      const json = await res.json().catch(() => ({ message: 'Non-JSON response' }));
      setResponseData(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Network request failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const curlSnippet = `curl -X ${selectedEndpoint.method} \\
  http://localhost:3000${selectedEndpoint.path} \\
  -H "Content-Type: application/json"${
    selectedEndpoint.defaultHeaders?.['Idempotency-Key']
      ? ` \\\n  -H "Idempotency-Key: ${selectedEndpoint.defaultHeaders['Idempotency-Key']}"`
      : ''
  }${
    selectedEndpoint.method !== 'GET' && requestBody
      ? ` \\\n  -d '${requestBody.replace(/\n\s*/g, '')}'`
      : ''
  }`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Code2 className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900">
              Interactive OpenAPI / REST API Explorer
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              HTTP/1.1 & HTTP/2 Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Uji coba langsung seluruh route backend Next.js API v1 dengan format respons standar, status code, latency ms, dan header Idempotency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700 border border-slate-200">
            Base URL: <strong className="text-blue-600">/api/v1</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint List Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-3 space-y-2 max-h-[640px] overflow-y-auto shadow-xs">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Available Endpoints ({ENDPOINTS.length})
          </div>
          {ENDPOINTS.map((ep) => (
            <div
              key={ep.id}
              onClick={() => handleSelectEndpoint(ep)}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                selectedEndpoint.id === ep.id
                  ? 'border-blue-600 bg-blue-50/70 font-bold'
                  : 'border-slate-100 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold ${
                    ep.method === 'GET'
                      ? 'bg-blue-600 text-white'
                      : ep.method === 'POST'
                      ? 'bg-emerald-600 text-white'
                      : ep.method === 'PATCH'
                      ? 'bg-amber-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {ep.method}
                </span>
                <span className="font-mono text-[11px] truncate text-slate-800">{ep.path.replace('/api/v1', '')}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans hidden sm:block shrink-0">{ep.category}</span>
            </div>
          ))}
        </div>

        {/* Request & Response Playground */}
        <div className="lg:col-span-8 space-y-4">
          {/* Endpoint Bar & Execute Button */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                  selectedEndpoint.method === 'GET'
                    ? 'bg-blue-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-sm font-bold text-slate-100 truncate">
                {selectedEndpoint.path}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                disabled={isLoading}
                onClick={handleExecute}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
                <span>{isLoading ? 'Executing...' : 'Send Request'}</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
            {selectedEndpoint.description}
          </div>

          {/* Request Headers & Body Editors */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Request Headers & Body (JSON)
              </span>
              <button
                onClick={handleCopyCurl}
                className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </div>

            {selectedEndpoint.method !== 'GET' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Payload Body:</label>
                <textarea
                  rows={6}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Response Console */}
          <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-200">Response Output</span>
              </div>

              {responseStatus !== null && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      responseStatus < 300
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    Status: {responseStatus}
                  </span>
                  {responseLatency !== null && (
                    <span className="text-slate-400">Latency: {responseLatency}ms</span>
                  )}
                </div>
              )}
            </div>

            <div className="h-64 overflow-y-auto font-mono text-xs text-slate-300 p-2 bg-black/40 rounded-xl">
              {responseData ? (
                <pre>{JSON.stringify(responseData, null, 2)}</pre>
              ) : (
                <div className="text-slate-500 text-center py-20">
                  Klik &ldquo;Send Request&rdquo; di atas untuk mengeksekusi endpoint live ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

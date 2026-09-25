'use client';

import React, { useState } from 'react';
import {
  Booking,
  TravelPackage,
  TravelSchedule,
  Destination,
  User,
  SupportTicket,
  AuditLog,
  CurrencyCode,
  PaymentMethod,
} from '@/lib/travel-system/types';
import { formatCurrency, formatDate } from '@/lib/travel-system/formatters';
import {
  DollarSign,
  TrendingUp,
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Users,
  Search,
  Filter,
  Eye,
  FileText,
  ShieldCheck,
  Send,
  Zap,
  Play,
  Calendar,
  Layers,
  Activity,
  Plus,
  ArrowUpDown,
  Download,
} from 'lucide-react';

interface OperationsConsoleProps {
  currentUser: User;
  bookings: Booking[];
  packages: TravelPackage[];
  schedules: TravelSchedule[];
  destinations: Destination[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  currency: CurrencyCode;
  lang: 'id' | 'en';
  onVerifyPayment: (bookingId: string) => void;
  onCancelBooking: (bookingId: string, reason: string) => void;
  onApproveRefund: (bookingId: string, notes: string) => void;
  onRejectRefund: (bookingId: string, notes: string) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
  onUpdateTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  onCreateSchedule: (data: { packageId: string; departureDate: string; returnDate: string; quota: number }) => void;
  onRunConcurrencyTest: (scheduleId: string, count: number) => {
    successful: number;
    failed: number;
    remainingQuota: number;
    logs: string[];
  };
  onViewInvoice: (bookingId: string) => void;
}

export function OperationsConsole({
  currentUser,
  bookings,
  packages,
  schedules,
  destinations,
  tickets,
  auditLogs,
  currency,
  lang,
  onVerifyPayment,
  onCancelBooking,
  onApproveRefund,
  onRejectRefund,
  onReplyTicket,
  onUpdateTicketStatus,
  onCreateSchedule,
  onRunConcurrencyTest,
  onViewInvoice,
}: OperationsConsoleProps) {
  const [activeOpsTab, setActiveOpsTab] = useState<
    'OVERVIEW' | 'BOOKINGS' | 'INVENTORY' | 'REFUNDS' | 'SUPPORT' | 'AUDIT' | 'REPORTS'
  >('OVERVIEW');

  // Booking filters
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null);

  // Concurrency tester state
  const [testScheduleId, setTestScheduleId] = useState<string>(schedules[0]?.id || '');
  const [testConcurrentCount, setTestConcurrentCount] = useState<number>(10);
  const [concurrencyResult, setConcurrencyResult] = useState<{
    successful: number;
    failed: number;
    remainingQuota: number;
    logs: string[];
  } | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Add schedule modal
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newSchPackageId, setNewSchPackageId] = useState(packages[0]?.id || '');
  const [newSchDepDate, setNewSchDepDate] = useState('2026-11-20');
  const [newSchRetDate, setNewSchRetDate] = useState('2026-11-24');
  const [newSchQuota, setNewSchQuota] = useState(20);

  // Support ticket active chat
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [replyMessage, setReplyMessage] = useState('');

  // Financial aggregates
  const paidBookings = bookings.filter((b) => b.paymentStatus === 'PAID');
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingPaymentsCount = bookings.filter((b) => b.bookingStatus === 'WAITING_PAYMENT').length;
  const confirmedBookingsCount = bookings.filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'COMPLETED').length;
  const refundRequests = bookings.filter((b) => b.refundStatus === 'REQUESTED');
  const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingStatusFilter !== 'ALL' && b.bookingStatus !== bookingStatusFilter) return false;
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      const match =
        b.bookingCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.packageTitle.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleRunStressTest = () => {
    if (!testScheduleId) return;
    setIsRunningTest(true);
    setTimeout(() => {
      const result = onRunConcurrencyTest(testScheduleId, testConcurrentCount);
      setConcurrencyResult(result);
      setIsRunningTest(false);
    }, 400);
  };

  const handleExportCsv = () => {
    const headers = ['BookingCode', 'CustomerName', 'Package', 'Departure', 'Amount', 'Status', 'PaymentMethod'];
    const rows = bookings.map((b) => [
      b.bookingCode,
      `"${b.customerName}"`,
      `"${b.packageTitle}"`,
      b.departureDate,
      b.totalAmount,
      b.bookingStatus,
      b.paymentMethod || 'NONE',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nusantara-travel-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Ops Sub-Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-extrabold text-slate-900">
              Operations Control Center
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Role: {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time booking orchestration, atomic quota locking, payment gateway verification & audit trail.
          </p>
        </div>

        {/* Action button to export */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {[
          { id: 'OVERVIEW', label: 'Overview & Metrik', icon: Activity },
          { id: 'BOOKINGS', label: `Daftar Reservasi (${bookings.length})`, icon: Ticket },
          { id: 'INVENTORY', label: 'Quota Concurrency Guard', icon: Zap },
          { id: 'REFUNDS', label: `Pusat Refund (${refundRequests.length})`, icon: RotateCcw },
          { id: 'SUPPORT', label: `Support Desk (${openTickets.length})`, icon: Send },
          { id: 'AUDIT', label: `Audit Trail (${auditLogs.length})`, icon: ShieldCheck },
          { id: 'REPORTS', label: 'Financial Reports', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveOpsTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition border-b-2 ${
                activeOpsTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW & METRICS */}
      {activeOpsTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Total Pendapatan</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {formatCurrency(totalRevenue, currency)}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +18.4% vs bulan lalu
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Booking Terkonfirmasi</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {confirmedBookingsCount} / {bookings.length}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Tingkat konversi bayar 84%
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Menunggu Bayar</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {pendingPaymentsCount}
              </div>
              <div className="text-[11px] text-amber-700 font-medium">
                Auto-expire dalam 15 menit
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Antrean Refund</span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {refundRequests.length}
              </div>
              <div className="text-[11px] text-rose-700 font-medium">
                Butuh verifikasi keuangan
              </div>
            </div>
          </div>

          {/* Revenue Simulation Chart & Popular Destinations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Tren Pendapatan Bulanan (2026)</h3>
                  <p className="text-xs text-slate-500">Pertumbuhan transaksi travel domestik</p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  Aggregated Revenue
                </span>
              </div>

              {/* Visual Bar Chart */}
              <div className="pt-4 flex items-end justify-between gap-3 h-48 border-b border-slate-100">
                {[
                  { month: 'Apr', rev: 42, label: 'Rp 42jt' },
                  { month: 'Mei', rev: 58, label: 'Rp 58jt' },
                  { month: 'Jun', rev: 76, label: 'Rp 76jt' },
                  { month: 'Jul', rev: 98, label: 'Rp 98jt' },
                  { month: 'Agt', rev: 114, label: 'Rp 114jt' },
                  { month: 'Sep', rev: 135, label: 'Rp 135jt' },
                ].map((item, idx) => {
                  const heightPercent = (item.rev / 140) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="text-[10px] text-slate-400 group-hover:text-blue-600 font-bold transition">
                        {item.label}
                      </div>
                      <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-blue-700 to-indigo-500 rounded-t-xl group-hover:brightness-110 transition-all duration-300"
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination Popularity */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Popularitas Destinasi</h3>
                <p className="text-xs text-slate-500">Pangsa pasar pesanan aktif</p>
              </div>

              <div className="space-y-3">
                {destinations.slice(0, 5).map((d, i) => (
                  <div key={d.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{d.name.split(' ')[0]}</span>
                      <span className="text-blue-600">⭐ {d.rating}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${85 - i * 14}%` }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BOOKINGS MANAGER */}
      {activeOpsTab === 'BOOKINGS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode booking, nama, paket..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full text-xs outline-hidden font-medium bg-transparent"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-semibold">Status:</span>
              {['ALL', 'WAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUND_REQUESTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setBookingStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    bookingStatusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Booking Code</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Paket & Jadwal</th>
                    <th className="py-3 px-4">Peserta</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status Reservasi</th>
                    <th className="py-3 px-4">Status Bayar</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data reservasi yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{bk.bookingCode}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{bk.customerName}</div>
                          <div className="text-[11px] text-slate-400">{bk.customerEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 line-clamp-1">{bk.packageTitle}</div>
                          <div className="text-[11px] text-slate-500">{bk.departureDate}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700">{bk.totalTravelers} Pax</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">
                          {formatCurrency(bk.totalAmount, currency)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              bk.bookingStatus === 'CONFIRMED' || bk.bookingStatus === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : bk.bookingStatus === 'WAITING_PAYMENT'
                                ? 'bg-amber-100 text-amber-800'
                                : bk.bookingStatus === 'CANCELLED'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {bk.bookingStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              bk.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : bk.paymentStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {bk.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Verify payment if waiting */}
                            {bk.bookingStatus === 'WAITING_PAYMENT' && (
                              <button
                                onClick={() => onVerifyPayment(bk.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition"
                                title="Verifikasi Pembayaran"
                              >
                                Verifikasi
                              </button>
                            )}

                            {/* View invoice */}
                            {(bk.paymentStatus === 'PAID' || bk.invoiceNumber) && (
                              <button
                                onClick={() => onViewInvoice(bk.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                                title="Cetak Faktur Pajak"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}

                            {/* Details modal trigger */}
                            <button
                              onClick={() => setSelectedBookingDetail(bk)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                              title="Detail Lengkap"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. INVENTORY & CONCURRENCY GUARD */}
      {activeOpsTab === 'INVENTORY' && (
        <div className="space-y-6">
          {/* Concurrency Simulator Tool Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-800/50 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Atomic Quota Concurrency Guard & Stress Tester
                </h3>
                <p className="text-xs text-slate-300">
                  Uji ketahanan sistem terhadap race-condition booking serentak tanpa risiko overselling kursi.
                </p>
              </div>
            </div>

            {/* Test Configuration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-xs border border-white/15">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Pilih Jadwal Uji:</label>
                <select
                  value={testScheduleId}
                  onChange={(e) => setTestScheduleId(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium outline-hidden"
                >
                  {schedules.map((s) => {
                    const pkg = packages.find((p) => p.id === s.packageId);
                    return (
                      <option key={s.id} value={s.id}>
                        {pkg?.title.slice(0, 24)}... ({s.departureDate}) — Sisa: {s.remainingQuota}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Jumlah Request Simultan:</label>
                <select
                  value={testConcurrentCount}
                  onChange={(e) => setTestConcurrentCount(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-medium outline-hidden"
                >
                  <option value={5}>5 Concurrent Requests</option>
                  <option value={10}>10 Concurrent Requests</option>
                  <option value={20}>20 Concurrent Requests</option>
                  <option value={30}>30 Concurrent Requests</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  disabled={isRunningTest}
                  onClick={handleRunStressTest}
                  className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {isRunningTest ? 'Menguji Mutex Lock...' : 'Jalankan Stress Test'}
                </button>
              </div>
            </div>

            {/* Concurrency Test Logs Output */}
            {concurrencyResult && (
              <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">
                    ✓ Sukses Terlayani: {concurrencyResult.successful}
                  </span>
                  <span className="text-rose-400 font-bold">
                    ✕ Ditolak (Cegah Oversell): {concurrencyResult.failed}
                  </span>
                  <span className="text-sky-400 font-bold">
                    Sisa Kuota Akhir: {concurrencyResult.remainingQuota}
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 bg-black/40 p-2 rounded-xl">
                  {concurrencyResult.logs.map((log, i) => (
                    <div
                      key={i}
                      className={log.includes('REJECTED') ? 'text-rose-400' : 'text-emerald-400'}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedules Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Inventori Jadwal & Kuota Aktif</h3>
                <p className="text-xs text-slate-500">Pemantauan real-time ketersediaan kursi tur per tanggal</p>
              </div>
              <button
                onClick={() => setShowAddScheduleModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Jadwal
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Paket Wisata</th>
                    <th className="py-3 px-4">Tgl Berangkat</th>
                    <th className="py-3 px-4">Tgl Kembali</th>
                    <th className="py-3 px-4">Kapasitas Total</th>
                    <th className="py-3 px-4">Sisa Kuota</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Surge Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {schedules.map((sch) => {
                    const pkg = packages.find((p) => p.id === sch.packageId);
                    return (
                      <tr key={sch.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{pkg?.title || sch.packageId}</td>
                        <td className="py-3 px-4 font-mono">{sch.departureDate}</td>
                        <td className="py-3 px-4 font-mono">{sch.returnDate}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{sch.quota} Kursi</td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-blue-700">{sch.remainingQuota}</span>
                          <span className="text-slate-400 text-[11px]"> ({sch.quota - sch.remainingQuota} terisi)</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sch.status === 'AVAILABLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sch.status === 'ALMOST_FULL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sch.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {sch.seasonalSurgeMultiplier || 1.0}x
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. REFUND CENTER */}
      {activeOpsTab === 'REFUNDS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Pusat Persetujuan Refund & Pembatalan</h3>
            <p className="text-xs text-slate-500">
              Verifikasi permohonan pengembalian dana sesuai klausul syarat & ketentuan travel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {refundRequests.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Tidak ada permohonan refund yang menunggu peninjauan saat ini.
              </div>
            ) : (
              refundRequests.map((bk) => (
                <div key={bk.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono font-bold text-sm text-blue-700">{bk.bookingCode}</div>
                      <div className="text-xs font-bold text-slate-900">{bk.customerName}</div>
                      <div className="text-[11px] text-slate-500">{bk.packageTitle}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Refund Requested
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Transaksi Asal:</span>
                      <span className="font-bold">{formatCurrency(bk.totalAmount, currency)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Nilai Refund Diajukan (80%):</span>
                      <span>{formatCurrency(bk.refundAmount || bk.totalAmount * 0.8, currency)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      Alasan: &ldquo;{bk.cancelReason || 'Permohonan pelanggan'}&rdquo;
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onApproveRefund(bk.id, 'Disetujui sesuai klausul medis & operasional')}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                    >
                      Setujui & Cairkan Refund
                    </button>
                    <button
                      onClick={() => onRejectRefund(bk.id, 'Tidak memenuhi batas waktu 7 hari pembatalan')}
                      className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. SUPPORT DESK */}
      {activeOpsTab === 'SUPPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket list */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Daftar Tiket Dukungan</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedTicket?.id === t.id
                      ? 'border-blue-600 bg-blue-50/70 font-semibold'
                      : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono font-bold text-slate-700">{t.ticketCode}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-bold ${
                        t.priority === 'HIGH' || t.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 line-clamp-1">{t.subject}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.userName}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active conversation thread */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between h-[550px]">
            {selectedTicket ? (
              <>
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-700">{selectedTicket.ticketCode}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedTicket.subject}</div>
                    <div className="text-[11px] text-slate-400">
                      Pemohon: {selectedTicket.userName} ({selectedTicket.userEmail})
                    </div>
                  </div>

                  <select
                    value={selectedTicket.status}
                    onChange={(e) => onUpdateTicketStatus(selectedTicket.id, e.target.value as any)}
                    className="text-xs p-1.5 rounded-lg border border-slate-200 font-medium"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="WAITING_CUSTOMER">WAITING_CUSTOMER</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {selectedTicket.messages.map((m) => {
                    const isStaff = m.senderRole === 'STAFF' || m.senderRole === 'ADMIN';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-0.5">
                          {m.senderName} ({m.senderRole}) • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                            isStaff
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply box */}
                <div className="border-t border-slate-100 pt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Tulis balasan staff operasional..."
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && replyMessage.trim()) {
                        onReplyTicket(selectedTicket.id, replyMessage);
                        setReplyMessage('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (replyMessage.trim()) {
                        onReplyTicket(selectedTicket.id, replyMessage);
                        setReplyMessage('');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Kirim
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs">Pilih tiket untuk membaca percakapan.</div>
            )}
          </div>
        </div>
      )}

      {/* 6. IMMUTABLE AUDIT TRAIL */}
      {activeOpsTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">System Immutable Audit Trail</h3>
            <p className="text-xs text-slate-500">
              Log forensik seluruh mutasi data kritis (Booking, Quota, Payment, Refund) dengan IP & correlation ID.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Change Log / Detail</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-800">
                        {log.userName}{' '}
                        <span className="text-[10px] text-blue-600 font-mono">({log.userRole})</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-900 text-white">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{log.entity}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-700 max-w-xs truncate">
                        {log.newValue || log.oldValue || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. FINANCIAL REPORTS */}
      {activeOpsTab === 'REPORTS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Rekapitulasi Laporan Finansial & Operasional</h3>
              <p className="text-xs text-slate-500">Agregasi pendapatan kotor, PPN 11%, dan biaya layanan.</p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download Full CSV
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400">Total Transaksi Selesai</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{paidBookings.length} Transaksi</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400">Pajak Pertambahan Nilai (PPN 11%)</span>
              <div className="text-xl font-extrabold text-blue-700 mt-1">
                {formatCurrency(paidBookings.reduce((sum, b) => sum + b.tax, 0), currency)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400">Pendapatan Platform Fee</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {formatCurrency(paidBookings.reduce((sum, b) => sum + b.serviceFee, 0), currency)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING DETAILS MODAL */}
      {selectedBookingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl text-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-base text-blue-700">
                  {selectedBookingDetail.bookingCode}
                </span>
                <div className="text-xs text-slate-400">ID: {selectedBookingDetail.id}</div>
              </div>
              <button onClick={() => setSelectedBookingDetail(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400">Customer:</span>
                  <div className="font-bold text-slate-800">{selectedBookingDetail.customerName}</div>
                  <div className="text-slate-500">{selectedBookingDetail.customerEmail}</div>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <div className="font-bold text-blue-600">{selectedBookingDetail.bookingStatus}</div>
                  <div className="text-slate-500">Bayar: {selectedBookingDetail.paymentStatus}</div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Daftar Peserta</span>
                <div className="space-y-1.5 mt-1">
                  {selectedBookingDetail.travelers.map((t, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{t.fullName} ({t.type})</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIK: {t.identityNumber}</div>
                      </div>
                      {t.specialRequest && (
                        <div className="text-[10px] text-amber-700 italic max-w-[140px] truncate">
                          &ldquo;{t.specialRequest}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-sm">
                <span>Total Amount:</span>
                <span className="text-blue-700">{formatCurrency(selectedBookingDetail.totalAmount, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD SCHEDULE MODAL */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Tambah Jadwal Baru</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Pilih Paket:</label>
                <select
                  value={newSchPackageId}
                  onChange={(e) => setNewSchPackageId(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 outline-hidden font-medium"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Tgl Keberangkatan:</label>
                  <input
                    type="date"
                    value={newSchDepDate}
                    onChange={(e) => setNewSchDepDate(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Tgl Kembali:</label>
                  <input
                    type="date"
                    value={newSchRetDate}
                    onChange={(e) => setNewSchRetDate(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Alokasi Kuota Kursi:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newSchQuota}
                  onChange={(e) => setNewSchQuota(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddScheduleModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onCreateSchedule({
                    packageId: newSchPackageId,
                    departureDate: newSchDepDate,
                    returnDate: newSchRetDate,
                    quota: newSchQuota,
                  });
                  setShowAddScheduleModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  TravelPackage,
  TravelSchedule,
  Destination,
  User,
  CurrencyCode,
  Traveler,
  Booking,
  PaymentMethod,
  Review,
} from '@/lib/travel-system/types';
import { formatCurrency, formatDate } from '@/lib/travel-system/formatters';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Ticket,
  ChevronRight,
  Info,
  CreditCard,
  QrCode,
  Building2,
  AlertCircle,
  FileText,
  MessageSquare,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

interface CustomerPortalProps {
  currentUser: User;
  packages: TravelPackage[];
  destinations: Destination[];
  schedules: TravelSchedule[];
  bookings: Booking[];
  reviews: Review[];
  currency: CurrencyCode;
  lang: 'id' | 'en';
  onBookTrip: (payload: {
    userId: string;
    packageId: string;
    scheduleId: string;
    travelers: Omit<Traveler, 'id' | 'bookingId'>[];
    couponCode?: string;
    paymentMethod: PaymentMethod;
  }) => Booking;
  onPayBooking: (bookingId: string, method: PaymentMethod) => void;
  onCancelBooking: (bookingId: string, reason: string) => void;
  onRequestRefund: (bookingId: string, reason: string) => void;
  onSubmitReview: (bookingId: string, rating: number, comment: string) => void;
  onViewInvoice: (bookingId: string) => void;
}

export function CustomerPortal({
  currentUser,
  packages,
  destinations,
  schedules,
  bookings,
  reviews,
  currency,
  lang,
  onBookTrip,
  onPayBooking,
  onCancelBooking,
  onRequestRefund,
  onSubmitReview,
  onViewInvoice,
}: CustomerPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'EXPLORE' | 'MY_BOOKINGS'>('EXPLORE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDestination, setSelectedDestination] = useState<string>('ALL');

  // Package details modal
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);

  // Booking drawer / flow
  const [bookingPackage, setBookingPackage] = useState<TravelPackage | null>(null);
  const [bookingScheduleId, setBookingScheduleId] = useState<string>('');
  const [travelers, setTravelers] = useState<Omit<Traveler, 'id' | 'bookingId'>[]>([
    {
      fullName: currentUser.fullName,
      type: 'ADULT',
      gender: 'MALE',
      dateOfBirth: '1995-05-15',
      nationality: 'Indonesian',
      identityNumber: '3171011505950001',
      phone: currentUser.phone,
      email: currentUser.email,
      specialRequest: '',
    },
  ]);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ discount: number; message: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BCA_VA');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<Booking | null>(null);

  // Review modal
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Cancel / Refund modal
  const [refundBooking, setRefundBooking] = useState<Booking | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');

  const categories = [
    { id: 'ALL', label: lang === 'id' ? 'Semua Destinasi' : 'All Tours' },
    { id: 'BEACH', label: 'Pantai & Kepulauan' },
    { id: 'ADVENTURE', label: 'Petualangan & Safari' },
    { id: 'NATURE', label: 'Taman Nasional & Alam' },
    { id: 'MOUNTAIN', label: 'Gunung & Kaldera' },
    { id: 'CULTURAL', label: 'Warisan Budaya & Sejarah' },
  ];

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    if (selectedCategory !== 'ALL' && pkg.category !== selectedCategory) return false;
    if (selectedDestination !== 'ALL' && pkg.destinationId !== selectedDestination) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        pkg.title.toLowerCase().includes(q) ||
        pkg.description.toLowerCase().includes(q) ||
        pkg.destinationName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // User's own bookings
  const myBookings = bookings.filter((b) => b.userId === currentUser.id);

  // Calculate pricing preview for current booking drawer
  const currentSchedule = schedules.find((s) => s.id === bookingScheduleId);
  const unitPrice = bookingPackage
    ? (bookingPackage.discountPrice || bookingPackage.price) * (currentSchedule?.seasonalSurgeMultiplier || 1.0)
    : 0;
  const subtotal = unitPrice * travelers.length;
  const discount = couponApplied ? couponApplied.discount : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * 0.11);
  const serviceFee = 50000;
  const totalAmount = taxable + tax + serviceFee;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const clean = couponCode.trim().toUpperCase();
    if (clean === 'EXPLOREINDONESIA') {
      const disc = Math.round(subtotal * 0.15);
      setCouponApplied({
        discount: Math.min(disc, 1500000),
        message: 'Diskon 15% Wonderful Indonesia berhasil digunakan!',
      });
    } else if (clean === 'BALIBEACH20') {
      setCouponApplied({
        discount: 500000,
        message: 'Kupon Rp 500.000 Bali Gateway berhasil diterapkan!',
      });
    } else if (clean === 'KOMODO750') {
      setCouponApplied({
        discount: 750000,
        message: 'Kupon Rp 750.000 Komodo Liveaboard berhasil diterapkan!',
      });
    } else {
      setCouponApplied(null);
      alert('Kode promo tidak valid atau tidak memenuhi syarat minimum transaksi.');
    }
  };

  const handleAddTraveler = () => {
    if (travelers.length >= 10) {
      alert('Maksimal 10 peserta per pemesanan.');
      return;
    }
    setTravelers([
      ...travelers,
      {
        fullName: '',
        type: 'ADULT',
        gender: 'MALE',
        dateOfBirth: '1998-01-01',
        nationality: 'Indonesian',
        identityNumber: '',
        phone: '',
      },
    ]);
  };

  const handleRemoveTraveler = (index: number) => {
    if (travelers.length <= 1) return;
    setTravelers(travelers.filter((_, i) => i !== index));
  };

  const handleUpdateTraveler = (index: number, field: keyof Omit<Traveler, 'id' | 'bookingId'>, val: any) => {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: val };
    setTravelers(updated);
  };

  const handleConfirmBooking = () => {
    setBookingError(null);
    if (!bookingPackage || !bookingScheduleId) {
      setBookingError('Silakan pilih jadwal keberangkatan terlebih dahulu.');
      return;
    }

    for (let i = 0; i < travelers.length; i++) {
      if (!travelers[i].fullName.trim()) {
        setBookingError(`Nama lengkap peserta #${i + 1} wajib diisi.`);
        return;
      }
      if (!travelers[i].identityNumber.trim()) {
        setBookingError(`Nomor NIK / Paspor peserta #${i + 1} wajib diisi.`);
        return;
      }
    }

    try {
      const created = onBookTrip({
        userId: currentUser.id,
        packageId: bookingPackage.id,
        scheduleId: bookingScheduleId,
        travelers,
        couponCode: couponApplied ? couponCode : undefined,
        paymentMethod,
      });
      setBookingSuccess(created);
    } catch (err: any) {
      setBookingError(err.message || 'Gagal memproses pemesanan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs: Browse Packages / My Bookings */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('EXPLORE')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'EXPLORE'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {lang === 'id' ? 'Eksplorasi Paket Wisata' : 'Explore Packages'}
          </button>
          <button
            onClick={() => setActiveSubTab('MY_BOOKINGS')}
            className={`relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeSubTab === 'MY_BOOKINGS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{lang === 'id' ? 'Pesanan & E-Tiket Saya' : 'My Bookings & Tickets'}</span>
            {myBookings.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-blue-700">
                {myBookings.length}
              </span>
            )}
          </button>
        </div>

        {/* Promo code badge alert */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Gunakan Kupon: <strong className="font-mono">EXPLOREINDONESIA</strong> (Diskon 15%)</span>
        </div>
      </div>

      {activeSubTab === 'EXPLORE' && (
        <>
          {/* Hero Banner with Search & Destination Select */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
            <div className="absolute inset-0 opacity-40 mix-blend-overlay">
              <img
                src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&auto=format&fit=crop&q=80"
                alt="Indonesian archipelago"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Wonderful Indonesia Luxury Curated Escapes
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Jelajahi Keindahan Nusantara dengan Pengalaman Tak Tertandingi
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm">
                Sistem reservasi real-time bergaransi kuota atomic lock, akomodasi resor bintang 5, pemandu bersertifikasi, dan asuransi perjalanan menyeluruh.
              </p>
            </div>

            {/* Quick Filter Bar */}
            <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-slate-800">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari paket, destinasi, atau kota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs outline-hidden font-medium placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-slate-800">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full text-xs outline-hidden font-medium text-slate-700 bg-transparent"
                >
                  <option value="ALL">Semua Destinasi Unggulan</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 text-slate-800">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs text-slate-600 truncate">
                  Keberangkatan: Periode 2026 Ready
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map((pkg) => {
              const packageSchedules = schedules.filter((s) => s.packageId === pkg.id);
              const availableSchedules = packageSchedules.filter((s) => s.status === 'AVAILABLE' || s.status === 'ALMOST_FULL');
              const nextSchedule = availableSchedules[0] || packageSchedules[0];

              return (
                <div
                  key={pkg.id}
                  className="group relative rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/85 text-white backdrop-blur-xs">
                          {pkg.duration}
                        </span>
                        {pkg.featured && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-slate-900 flex items-center gap-1 shadow-xs">
                            <Sparkles className="w-3 h-3" /> Featured
                          </span>
                        )}
                      </div>

                      {/* Quota indicator */}
                      <div className="absolute bottom-3 right-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs ${
                            pkg.availableQuota <= 5
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-600/90 text-white'
                          }`}
                        >
                          {pkg.availableQuota > 0 ? `${pkg.availableQuota} Kursi Tersedia` : 'Fully Booked'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-blue-600">
                          <MapPin className="w-3.5 h-3.5" />
                          {pkg.destinationName}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {pkg.rating.toFixed(2)} ({pkg.reviewCount})
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition leading-snug">
                        {pkg.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {pkg.description}
                      </p>

                      {/* Key highlights */}
                      <div className="pt-1 flex flex-wrap gap-1 text-[11px] text-slate-500">
                        {pkg.inclusions.slice(0, 2).map((inc, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {inc.slice(0, 32)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Booking CTA */}
                  <div className="p-5 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Mulai dari / pax</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-extrabold text-slate-900">
                          {formatCurrency(pkg.discountPrice || pkg.price, currency)}
                        </span>
                        {pkg.discountPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatCurrency(pkg.price, currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPackage(pkg)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => {
                          setBookingPackage(pkg);
                          const scheds = schedules.filter((s) => s.packageId === pkg.id && s.remainingQuota > 0);
                          if (scheds.length > 0) {
                            setBookingScheduleId(scheds[0].id);
                          }
                          setBookingSuccess(null);
                          setBookingError(null);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition flex items-center gap-1"
                      >
                        <span>Pesan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MY BOOKINGS TAB */}
      {activeSubTab === 'MY_BOOKINGS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Daftar Pesanan & E-Tiket Saya</h2>
              <p className="text-xs text-slate-500">Kelola riwayat booking, bayar pesanan aktif, cetak invoice, atau ajukan refund.</p>
            </div>
          </div>

          {myBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">Belum Ada Riwayat Pemesanan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Pilih paket perjalanan impian Anda di katalog Nusantara Travel untuk melakukan reservasi.
              </p>
              <button
                onClick={() => setActiveSubTab('EXPLORE')}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition"
              >
                Jelajahi Paket Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.map((bk) => (
                <div
                  key={bk.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{bk.bookingCode}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            bk.bookingStatus === 'CONFIRMED' || bk.bookingStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bk.bookingStatus === 'WAITING_PAYMENT'
                              ? 'bg-amber-100 text-amber-800'
                              : bk.bookingStatus === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : bk.bookingStatus === 'CANCELLED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {bk.bookingStatus}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Dipesan pada: {formatDate(bk.createdAt)} • Jadwal:{' '}
                        <strong>{formatDate(bk.departureDate)}</strong> s/d {formatDate(bk.returnDate)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Total Tagihan</div>
                      <div className="text-base font-extrabold text-blue-700">
                        {formatCurrency(bk.totalAmount, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Trip Info & Travelers Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="text-slate-400 font-medium">Paket Wisata</div>
                      <div className="font-bold text-slate-800">{bk.packageTitle}</div>
                      <div className="text-slate-500">{bk.destinationName}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Peserta ({bk.totalTravelers} Pax)</div>
                      <div className="font-medium text-slate-700 truncate">
                        {bk.travelers.map((t) => t.fullName).join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Metode Pembayaran</div>
                      <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        {bk.paymentMethod?.replace('_', ' ') || 'Belum Dipilih'}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      {bk.bookingStatus === 'WAITING_PAYMENT' && (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                          Selesaikan pembayaran dalam jendela 15 menit
                        </span>
                      )}
                      {bk.bookingStatus === 'CONFIRMED' && (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Reservasi terkonfirmasi & e-tiket aktif
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Pay button for waiting payment */}
                      {bk.bookingStatus === 'WAITING_PAYMENT' && (
                        <button
                          onClick={() => onPayBooking(bk.id, bk.paymentMethod || 'BCA_VA')}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Bayar Sekarang
                        </button>
                      )}

                      {/* View Invoice */}
                      {(bk.paymentStatus === 'PAID' || bk.invoiceNumber) && (
                        <button
                          onClick={() => onViewInvoice(bk.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          Lihat Faktur Pajak / Invoice
                        </button>
                      )}

                      {/* Review for completed trips */}
                      {(bk.bookingStatus === 'COMPLETED' || bk.bookingStatus === 'CONFIRMED') && (
                        <button
                          onClick={() => {
                            setReviewModalBooking(bk);
                            setReviewRating(5);
                            setReviewComment('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs font-medium hover:bg-amber-100 transition flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          Beri Ulasan
                        </button>
                      )}

                      {/* Cancel or Refund button */}
                      {bk.bookingStatus === 'WAITING_PAYMENT' && (
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin membatalkan pesanan ${bk.bookingCode}? Kursi akan dikembalikan ke kuota.`)) {
                              onCancelBooking(bk.id, 'Dibatalkan oleh pelanggan');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
                        >
                          Batalkan
                        </button>
                      )}

                      {bk.bookingStatus === 'CONFIRMED' && !bk.refundStatus && (
                        <button
                          onClick={() => {
                            setRefundBooking(bk);
                            setRefundReason('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50 transition"
                        >
                          Ajukan Refund
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PACKAGE DETAIL MODAL */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl text-slate-800 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  {selectedPackage.destinationName} • {selectedPackage.duration}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedPackage.title}</h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-bold text-slate-800">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {selectedPackage.rating.toFixed(2)} ({selectedPackage.reviewCount} ulasan wisatawan)
                  </span>
                  <span>•</span>
                  <span>Maksimal {selectedPackage.maximumParticipant} Pax</span>
                </div>
              </div>

              {/* Gallery Preview */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden h-48">
                {selectedPackage.gallery.concat([selectedPackage.imageUrl]).slice(0, 3).map((img, i) => (
                  <img key={i} src={img} alt="Gallery" className="w-full h-full object-cover" />
                ))}
              </div>

              {/* Itinerary Accordion */}
              <div>
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-3">
                  Rencana Perjalanan Harian (Itinerary)
                </h3>
                <div className="space-y-3">
                  {selectedPackage.itinerary.map((it) => (
                    <div key={it.dayNumber} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-700 mb-1">
                        <span>HARI {it.dayNumber}: {it.title}</span>
                        <span className="text-slate-500 font-normal">{it.startTime} - {it.endTime}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{it.description}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          🍽️ {it.meal}
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          🚐 {it.transport}
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          🏨 {it.accommodation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Fasilitas Termasuk (Inclusions)
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    {selectedPackage.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100 space-y-2">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Tidak Termasuk (Exclusions)
                  </div>
                  <ul className="space-y-1 text-slate-700">
                    {selectedPackage.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Kebijakan Pembatalan:</strong> {selectedPackage.cancellationPolicy}
                </div>
              </div>

              {/* Book Now Button */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <div>
                  <div className="text-xs text-slate-400">Harga per pax:</div>
                  <div className="text-xl font-extrabold text-blue-700">
                    {formatCurrency(selectedPackage.discountPrice || selectedPackage.price, currency)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const pkg = selectedPackage;
                    setSelectedPackage(null);
                    setBookingPackage(pkg);
                    const scheds = schedules.filter((s) => s.packageId === pkg.id && s.remainingQuota > 0);
                    if (scheds.length > 0) setBookingScheduleId(scheds[0].id);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
                >
                  Pesan Paket Ini Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING DRAWER / MODAL */}
      {bookingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-slate-800 my-8 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setBookingPackage(null);
                setBookingSuccess(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">Reservasi Kursi Berhasil!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Kode Booking: <strong className="font-mono text-blue-600">{bookingSuccess.bookingCode}</strong>.
                  Sistem telah mengunci kuota kursi Anda melalui distributed concurrency lock.
                </p>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2 max-w-md mx-auto text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Pembayaran:</span>
                    <span className="font-extrabold text-blue-700">{formatCurrency(bookingSuccess.totalAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batas Waktu Bayar:</span>
                    <span className="font-semibold text-rose-600">15 Menit dari sekarang</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Virtual Account:</span>
                    <span className="font-mono font-bold text-slate-800">
                      88019{bookingSuccess.id.replace(/\D/g, '').padEnd(8, '7').slice(0, 8)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      onPayBooking(bookingSuccess.id, paymentMethod);
                      setBookingPackage(null);
                      setActiveSubTab('MY_BOOKINGS');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-md transition"
                  >
                    Simulasikan Pembayaran Instan
                  </button>
                  <button
                    onClick={() => {
                      setBookingPackage(null);
                      setActiveSubTab('MY_BOOKINGS');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                  >
                    Lihat di Pesanan Saya
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                    Formulir Reservasi Wisata & Kunci Kuota
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{bookingPackage.title}</h2>
                  <div className="text-xs text-slate-500">
                    Durasi: {bookingPackage.duration} • Destinasi: {bookingPackage.destinationName}
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Step 1: Select Schedule */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>1. Pilih Jadwal Keberangkatan & Sisa Kuota</span>
                    <span className="text-[11px] font-normal text-slate-400">Atomic concurrency check</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {schedules
                      .filter((s) => s.packageId === bookingPackage.id)
                      .map((sch) => (
                        <div
                          key={sch.id}
                          onClick={() => sch.remainingQuota > 0 && setBookingScheduleId(sch.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                            bookingScheduleId === sch.id
                              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                              : sch.remainingQuota === 0
                              ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                            <span>{formatDate(sch.departureDate)}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                sch.remainingQuota === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : sch.remainingQuota <= 5
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {sch.remainingQuota} Kursi Sisa
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Kembali: {formatDate(sch.returnDate)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Step 2: Traveler Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      2. Data Peserta / Traveler ({travelers.length} Pax)
                    </label>
                    <button
                      onClick={handleAddTraveler}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Peserta
                    </button>
                  </div>

                  <div className="space-y-3">
                    {travelers.map((trv, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Peserta #{idx + 1}</span>
                          {travelers.length > 1 && (
                            <button
                              onClick={() => handleRemoveTraveler(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500">Nama Lengkap (Sesuai KTP/Paspor)</label>
                            <input
                              type="text"
                              value={trv.fullName}
                              onChange={(e) => handleUpdateTraveler(idx, 'fullName', e.target.value)}
                              placeholder="e.g. Nabil Robbani"
                              className="w-full mt-1 p-2 rounded-lg bg-white border border-slate-200 outline-hidden font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-500">Nomor NIK / Paspor</label>
                            <input
                              type="text"
                              value={trv.identityNumber}
                              onChange={(e) => handleUpdateTraveler(idx, 'identityNumber', e.target.value)}
                              placeholder="317101..."
                              className="w-full mt-1 p-2 rounded-lg bg-white border border-slate-200 outline-hidden font-medium font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-500">Tipe Peserta</label>
                            <select
                              value={trv.type}
                              onChange={(e) => handleUpdateTraveler(idx, 'type', e.target.value)}
                              className="w-full mt-1 p-2 rounded-lg bg-white border border-slate-200 outline-hidden font-medium"
                            >
                              <option value="ADULT">Dewasa (Adult 12+)</option>
                              <option value="CHILD">Anak (Child 2-11 thn)</option>
                              <option value="INFANT">Bayi (Infant &lt; 2 thn)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-500">Permintaan Khusus (Opsional)</label>
                            <input
                              type="text"
                              value={trv.specialRequest || ''}
                              onChange={(e) => handleUpdateTraveler(idx, 'specialRequest', e.target.value)}
                              placeholder="e.g. Vegetarian, Bed King"
                              className="w-full mt-1 p-2 rounded-lg bg-white border border-slate-200 outline-hidden font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Promo Coupon */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">3. Kode Promo / Diskon</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Masukkan kode promo (e.g. EXPLOREINDONESIA)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase font-bold outline-hidden"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Terapkan
                    </button>
                  </div>
                  {couponApplied && (
                    <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {couponApplied.message}
                    </div>
                  )}
                </div>

                {/* Step 4: Payment Method */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">4. Metode Pembayaran</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
                    {[
                      { id: 'BCA_VA', label: 'BCA Virtual Account', icon: Building2 },
                      { id: 'MANDIRI_VA', label: 'Mandiri VA', icon: Building2 },
                      { id: 'QRIS', label: 'QRIS / E-Wallet', icon: QrCode },
                      { id: 'CREDIT_CARD', label: 'Credit Card (Visa/MC)', icon: CreditCard },
                    ].map((pm) => {
                      const Icon = pm.icon;
                      return (
                        <div
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                          className={`p-3 rounded-xl border cursor-pointer text-center space-y-1 transition ${
                            paymentMethod === pm.id
                              ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto text-slate-500" />
                          <div className="text-[11px] leading-tight">{pm.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({travelers.length} Pax):</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(subtotal, currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Diskon Promo:</span>
                      <span>- {formatCurrency(discount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>PPN 11% (Pajak Resmi):</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(tax, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Layanan & Asuransi:</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(serviceFee, currency)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-blue-700">
                    <span>TOTAL TAGIHAN:</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={handleConfirmBooking}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi Booking & Kunci Kursi (15 Menit)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVIEW SUBMIT MODAL */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Beri Ulasan Perjalanan</h3>
              <button onClick={() => setReviewModalBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Bagikan pengalaman liburan Anda untuk paket <strong>{reviewModalBooking.packageTitle}</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Rating Bintang:</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Komentar & Pengalaman:</label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Ceritakan kepuasan hotel, makanan, pemandu, dan destinasi..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-hidden"
              />
            </div>

            <button
              onClick={() => {
                if (!reviewComment.trim()) {
                  alert('Komentar tidak boleh kosong.');
                  return;
                }
                onSubmitReview(reviewModalBooking.id, reviewRating, reviewComment);
                setReviewModalBooking(null);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
            >
              Kirim Ulasan Resmi
            </button>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Pengajuan Refund Pembatalan</h3>
              <button onClick={() => setRefundBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <p>Booking: <strong className="font-mono">{refundBooking.bookingCode}</strong></p>
              <p>Total Transaksi: <strong>{formatCurrency(refundBooking.totalAmount, currency)}</strong></p>
              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 text-[11px]">
                Sesuai kebijakan pembatalan &gt;7 hari sebelum keberangkatan, pengembalian dana yang disetujui adalah sebesar <strong>80% ({formatCurrency(Math.round(refundBooking.totalAmount * 0.8), currency)})</strong>.
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Alasan Pembatalan:</label>
              <textarea
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Tuliskan alasan pembatalan (misal kondisi darurat medis, perubahan dinas luar kota)..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-hidden"
              />
            </div>

            <button
              onClick={() => {
                if (!refundReason.trim()) {
                  alert('Harap sertakan alasan pembatalan.');
                  return;
                }
                onRequestRefund(refundBooking.id, refundReason);
                setRefundBooking(null);
              }}
              className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
            >
              Kirim Pengajuan Refund
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

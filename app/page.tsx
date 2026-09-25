'use client';

import React, { useState, useEffect } from 'react';
import { travelStore } from '@/lib/travel-system/store';
import {
  User,
  UserRole,
  CurrencyCode,
  TravelPackage,
  TravelSchedule,
  Destination,
  Booking,
  SupportTicket,
  AuditLog,
  Notification,
  PaymentMethod,
  Invoice,
  Review,
} from '@/lib/travel-system/types';
import { Navbar } from '@/components/Navbar';
import { CustomerPortal } from '@/components/CustomerPortal';
import { OperationsConsole } from '@/components/OperationsConsole';
import { ApiExplorer } from '@/components/ApiExplorer';
import { ArchitectureViewer } from '@/components/ArchitectureViewer';
import { InvoiceModal } from '@/components/InvoiceModal';

export default function TravelManagementApp() {
  // Core Store State initialized safely
  const [allUsers, setAllUsers] = useState<User[]>(() => travelStore.getUsers());
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const users = travelStore.getUsers();
    return users.find((u) => u.role === 'CUSTOMER') || users[0];
  });
  const [packages, setPackages] = useState<TravelPackage[]>(() => travelStore.getPackages());
  const [schedules, setSchedules] = useState<TravelSchedule[]>(() => travelStore.getSchedules());
  const [destinations, setDestinations] = useState<Destination[]>(() => travelStore.getDestinations());
  const [bookings, setBookings] = useState<Booking[]>(() => travelStore.getBookings());
  const [reviews, setReviews] = useState<Review[]>(() => travelStore.getReviews());
  const [tickets, setTickets] = useState<SupportTicket[]>(() => travelStore.getTickets());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => travelStore.getAuditLogs());
  const [notifications, setNotifications] = useState<Notification[]>(() => travelStore.getNotifications());

  // Navigation & Preferences State
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'OPERATIONS' | 'API_DOCS' | 'ARCHITECTURE'>(
    'MARKETPLACE'
  );
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');
  const [lang, setLang] = useState<'id' | 'en'>('id');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Active Invoice View Modal
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Sync state from TravelStore
  const refreshStoreState = () => {
    setAllUsers(travelStore.getUsers());
    setPackages(travelStore.getPackages());
    setSchedules(travelStore.getSchedules());
    setDestinations(travelStore.getDestinations());
    setBookings(travelStore.getBookings());
    setReviews(travelStore.getReviews());
    setTickets(travelStore.getTickets());
    setAuditLogs(travelStore.getAuditLogs());
    setNotifications(travelStore.getNotifications());
  };

  if (!isMounted || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-semibold tracking-wide">
            Menginisialisasi Nusantara Travel Management Engine...
          </div>
        </div>
      </div>
    );
  }

  // Handlers for Store Mutations
  const handleBookTrip = (payload: {
    userId: string;
    packageId: string;
    scheduleId: string;
    travelers: any[];
    couponCode?: string;
    paymentMethod: PaymentMethod;
  }) => {
    const booking = travelStore.createBooking(payload);
    refreshStoreState();
    return booking;
  };

  const handlePayBooking = (bookingId: string, method: PaymentMethod) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    travelStore.processPayment({
      bookingId,
      method,
    });
    refreshStoreState();
  };

  const handleCancelBooking = (bookingId: string, reason: string) => {
    travelStore.cancelBooking(bookingId, reason, currentUser);
    refreshStoreState();
  };

  const handleRequestRefund = (bookingId: string, reason: string) => {
    travelStore.requestRefund(bookingId, reason, currentUser);
    refreshStoreState();
  };

  const handleApproveRefund = (bookingId: string, notes: string) => {
    travelStore.approveRefund(bookingId, notes, currentUser);
    refreshStoreState();
  };

  const handleRejectRefund = (bookingId: string, notes: string) => {
    travelStore.rejectRefund(bookingId, notes, currentUser);
    refreshStoreState();
  };

  const handleSubmitReview = (bookingId: string, rating: number, comment: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    travelStore.addReview({
      bookingId,
      packageId: booking.packageId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      rating,
      comment,
    });
    refreshStoreState();
  };

  const handleReplyTicket = (ticketId: string, message: string) => {
    travelStore.replyTicket(ticketId, message, currentUser);
    refreshStoreState();
  };

  const handleUpdateTicketStatus = (ticketId: string, status: SupportTicket['status']) => {
    travelStore.updateTicketStatus(ticketId, status, currentUser);
    refreshStoreState();
  };

  const handleCreateSchedule = (data: {
    packageId: string;
    departureDate: string;
    returnDate: string;
    quota: number;
  }) => {
    travelStore.createSchedule(
      {
        ...data,
        remainingQuota: data.quota,
        status: 'AVAILABLE',
        seasonalSurgeMultiplier: 1.0,
      },
      currentUser
    );
    refreshStoreState();
  };

  const handleRunConcurrencyTest = (scheduleId: string, count: number) => {
    const result = travelStore.simulateConcurrentBookings(scheduleId, count);
    refreshStoreState();
    return result;
  };

  const handleViewInvoice = (bookingId: string) => {
    const invoice = travelStore.getInvoiceByBookingId(bookingId);
    if (invoice) {
      setActiveInvoice(invoice);
    } else {
      alert('Invoice belum tersedia untuk reservasi ini.');
    }
  };

  const handleResetData = () => {
    travelStore.resetToSeed();
    refreshStoreState();
    const users = travelStore.getUsers();
    setCurrentUser(users.find((u) => u.role === 'CUSTOMER') || users[0]);
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header Navbar */}
      <Navbar
        currentRole={currentUser.role}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={(u) => setCurrentUser(u)}
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
        currency={currency}
        onSelectCurrency={(c) => setCurrency(c)}
        lang={lang}
        onToggleLang={() => setLang(lang === 'id' ? 'en' : 'id')}
        notifications={notifications}
        onMarkNotificationRead={(id) => {
          travelStore.markNotificationRead(id);
          refreshStoreState();
        }}
        onMarkAllNotificationsRead={() => {
          travelStore.markAllNotificationsRead();
          refreshStoreState();
        }}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'MARKETPLACE' && (
          <CustomerPortal
            currentUser={currentUser}
            packages={packages}
            destinations={destinations}
            schedules={schedules}
            bookings={bookings}
            reviews={reviews}
            currency={currency}
            lang={lang}
            onBookTrip={handleBookTrip}
            onPayBooking={handlePayBooking}
            onCancelBooking={handleCancelBooking}
            onRequestRefund={handleRequestRefund}
            onSubmitReview={handleSubmitReview}
            onViewInvoice={handleViewInvoice}
          />
        )}

        {activeTab === 'OPERATIONS' && (
          <OperationsConsole
            currentUser={currentUser}
            bookings={bookings}
            packages={packages}
            schedules={schedules}
            destinations={destinations}
            tickets={tickets}
            auditLogs={auditLogs}
            currency={currency}
            lang={lang}
            onVerifyPayment={(id) => handlePayBooking(id, 'MANUAL_TRANSFER')}
            onCancelBooking={handleCancelBooking}
            onApproveRefund={handleApproveRefund}
            onRejectRefund={handleRejectRefund}
            onReplyTicket={handleReplyTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onCreateSchedule={handleCreateSchedule}
            onRunConcurrencyTest={handleRunConcurrencyTest}
            onViewInvoice={handleViewInvoice}
          />
        )}

        {activeTab === 'API_DOCS' && <ApiExplorer />}

        {activeTab === 'ARCHITECTURE' && <ArchitectureViewer />}
      </main>

      {/* Official Tax Invoice / Faktur Pajak Modal */}
      <InvoiceModal
        invoice={activeInvoice}
        currency={currency}
        onClose={() => setActiveInvoice(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <strong>Nusantara Travel System</strong> • Clean Architecture, Atomic Concurrency, Mutex Guard, & OpenAPI REST Services.
          </div>
          <div className="text-[11px] text-slate-400">
            Powered by Next.js 15, TypeScript & Tailwind CSS • Production Ready
          </div>
        </div>
      </footer>
    </div>
  );
}

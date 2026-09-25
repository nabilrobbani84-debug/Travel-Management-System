'use client';

import React, { useState } from 'react';
import { Database, Server, Shield, Layers, Box, Cpu, HardDrive, Lock, CheckCircle2 } from 'lucide-react';

export function ArchitectureViewer() {
  const [activeTab, setActiveTab] = useState<'ERD' | 'CONCURRENCY' | 'CLEAN_ARCH' | 'PRISMA'>('ERD');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Database className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900">
              System Architecture & Relational ERD
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              PostgreSQL 16 + Redis 7 + Clean Arch
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi skema database terenkapsulasi, pemisahan dependensi Clean Architecture, dan alur mutex locking untuk mitigasi race-condition.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'ERD', label: 'Relational ERD' },
            { id: 'CONCURRENCY', label: 'Concurrency Mutex' },
            { id: 'CLEAN_ARCH', label: 'Clean Architecture' },
            { id: 'PRISMA', label: 'Prisma Schema' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. RELATIONAL ERD */}
      {activeTab === 'ERD' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-white space-y-6 overflow-x-auto">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span className="font-bold text-indigo-400">PostgreSQL Relational Schema (3NF Normalized, 28+ Fields, Composite Indexes)</span>
              <span>1:N & M:N Foreign Key Integrity</span>
            </div>

            {/* Grid of Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[760px]">
              {/* Table: Users */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-indigo-900/60 px-3 py-2 font-bold text-indigo-200 border-b border-indigo-800 flex items-center justify-between">
                  <span>users</span>
                  <span className="text-[10px] bg-indigo-800/80 px-1.5 rounded">PK: id</span>
                </div>
                <div className="p-3 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-amber-400 font-bold">id: UUID [PK]</div>
                  <div>email: VARCHAR(255) [UQ]</div>
                  <div>password_hash: VARCHAR</div>
                  <div>full_name: VARCHAR(150)</div>
                  <div>role: ENUM(CUSTOMER,STAFF,ADMIN)</div>
                  <div>phone: VARCHAR(30)</div>
                  <div>created_at: TIMESTAMPTZ</div>
                </div>
              </div>

              {/* Table: Destinations */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-blue-900/60 px-3 py-2 font-bold text-blue-200 border-b border-blue-800 flex items-center justify-between">
                  <span>destinations</span>
                  <span className="text-[10px] bg-blue-800/80 px-1.5 rounded">PK: id</span>
                </div>
                <div className="p-3 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-amber-400 font-bold">id: UUID [PK]</div>
                  <div>name: VARCHAR(100)</div>
                  <div>city: VARCHAR(50)</div>
                  <div>province: VARCHAR(50)</div>
                  <div>rating: DECIMAL(3,2)</div>
                  <div>is_active: BOOLEAN</div>
                </div>
              </div>

              {/* Table: Packages */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-sky-900/60 px-3 py-2 font-bold text-sky-200 border-b border-sky-800 flex items-center justify-between">
                  <span>travel_packages</span>
                  <span className="text-[10px] bg-sky-800/80 px-1.5 rounded">PK: id</span>
                </div>
                <div className="p-3 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-amber-400 font-bold">id: UUID [PK]</div>
                  <div className="text-sky-400">destination_id: UUID [FK]</div>
                  <div>title: VARCHAR(200)</div>
                  <div>duration: VARCHAR(20)</div>
                  <div>base_price: BIGINT</div>
                  <div>featured: BOOLEAN</div>
                </div>
              </div>

              {/* Table: Schedules */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-emerald-900/60 px-3 py-2 font-bold text-emerald-200 border-b border-emerald-800 flex items-center justify-between">
                  <span>travel_schedules</span>
                  <span className="text-[10px] bg-emerald-800/80 px-1.5 rounded">Atomic Guard</span>
                </div>
                <div className="p-3 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-amber-400 font-bold">id: UUID [PK]</div>
                  <div className="text-sky-400">package_id: UUID [FK]</div>
                  <div>departure_date: DATE</div>
                  <div>return_date: DATE</div>
                  <div className="text-emerald-400 font-bold">quota: INT</div>
                  <div className="text-emerald-400 font-bold">remaining_quota: INT</div>
                  <div>surge_multiplier: DECIMAL</div>
                </div>
              </div>

              {/* Table: Bookings */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-purple-900/60 px-3 py-2 font-bold text-purple-200 border-b border-purple-800 flex items-center justify-between">
                  <span>bookings</span>
                  <span className="text-[10px] bg-purple-800/80 px-1.5 rounded">Core Transaction</span>
                </div>
                <div className="p-3 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-amber-400 font-bold">id: UUID [PK]</div>
                  <div className="text-indigo-400">user_id: UUID [FK]</div>
                  <div className="text-emerald-400">schedule_id: UUID [FK]</div>
                  <div>booking_code: VARCHAR(30) [UQ]</div>
                  <div>status: ENUM</div>
                  <div>total_amount: BIGINT</div>
                  <div>expires_at: TIMESTAMPTZ</div>
                </div>
              </div>

              {/* Table: Travelers */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-amber-900/60 px-3 py-2 font-bold text-amber-200 border-b border-amber-800 flex items-center justify-between">
                  <span>travelers</span>
                  <span className="text-[10px] bg-amber-800/80 px-1.5 rounded">Manifest Pax</span>
                </div>
                <div className="p-3 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-amber-400 font-bold">id: UUID [PK]</div>
                  <div className="text-purple-400">booking_id: UUID [FK]</div>
                  <div>full_name: VARCHAR(150)</div>
                  <div>identity_number: VARCHAR(50)</div>
                  <div>type: ENUM(ADULT,CHILD,INFANT)</div>
                  <div>special_request: TEXT</div>
                </div>
              </div>

              {/* Table: Payments */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-teal-900/60 px-3 py-2 font-bold text-teal-200 border-b border-teal-800 flex items-center justify-between">
                  <span>payments</span>
                  <span className="text-[10px] bg-teal-800/80 px-1.5 rounded">Ledger</span>
                </div>
                <div className="p-3 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-amber-400 font-bold">id: UUID [PK]</div>
                  <div className="text-purple-400">booking_id: UUID [FK]</div>
                  <div>idempotency_key: VARCHAR [UQ]</div>
                  <div>amount: BIGINT</div>
                  <div>method: ENUM</div>
                  <div>status: ENUM</div>
                  <div>paid_at: TIMESTAMPTZ</div>
                </div>
              </div>

              {/* Table: AuditLogs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="bg-rose-900/60 px-3 py-2 font-bold text-rose-200 border-b border-rose-800 flex items-center justify-between">
                  <span>audit_logs</span>
                  <span className="text-[10px] bg-rose-800/80 px-1.5 rounded">Immutable Trail</span>
                </div>
                <div className="p-3 font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-amber-400 font-bold">id: UUID [PK]</div>
                  <div>user_id: UUID</div>
                  <div>action: VARCHAR(50)</div>
                  <div>entity: VARCHAR(50)</div>
                  <div>ip_address: VARCHAR(45)</div>
                  <div>timestamp: TIMESTAMPTZ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONCURRENCY MUTEX */}
      {activeTab === 'CONCURRENCY' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Mitigasi Race-Condition: Atomic Quota Guard & Mutex Locking
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bagaimana sistem mengantisipasi lonjakan ribuan reservasi kursi tur secara simultan tanpa terjadinya overselling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                Incoming Booking Request
              </div>
              <p className="text-slate-600">
                Customer mengajukan pemesanan dengan N traveler. Server menerima request dan mencatat waktu awal transaksi.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                Acquire Mutex / Row Lock
              </div>
              <p className="text-slate-600">
                Sistem mengunci baris jadwal via `SELECT FOR UPDATE` di PostgreSQL / Redis lock. Request lain yang menyasar jadwal sama harus menunggu antrean.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                Atomic Decrement & Check
              </div>
              <p className="text-slate-600">
                Jika `remainingQuota &gt;= requestedPax`, kuota dipotong seketika dan status booking diubah ke `WAITING_PAYMENT` dengan jendela TTL 15 menit.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">4</span>
                15-Min TTL Auto Release
              </div>
              <p className="text-slate-600">
                Jika pembayaran tidak terkonfirmasi dalam 15 menit, background worker (BullMQ) otomatis mengembalikan kursi ke inventori `remainingQuota`.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. CLEAN ARCHITECTURE */}
      {activeTab === 'CLEAN_ARCH' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Clean Architecture Boundary Separation
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aturan ketergantungan mengarah ke dalam: Domain tidak mengetahui framework maupun database.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <strong className="text-purple-900 font-bold text-sm">1. Domain Layer (Core Entities):</strong>
              <p className="text-slate-700 mt-1">
                Entitas `Traveler`, `TravelPackage`, `Booking`, `PaymentMethod`, dan kalkulator pajak. Tanpa dependensi eksternal, murni TypeScript.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <strong className="text-blue-900 font-bold text-sm">2. Application Layer (Use Cases):</strong>
              <p className="text-slate-700 mt-1">
                `CreateBookingUseCase`, `ProcessPaymentUseCase`, `CancelAndRefundUseCase`, dan abstraksi event dispatcher.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <strong className="text-emerald-900 font-bold text-sm">3. Infrastructure Layer (Adapters):</strong>
              <p className="text-slate-700 mt-1">
                Implementasi database Prisma ORM, Redis distributed locks, adapter Payment Gateway (BCA/Mandiri/QRIS), dan S3 Object Storage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <strong className="text-amber-900 font-bold text-sm">4. Presentation Layer:</strong>
              <p className="text-slate-700 mt-1">
                Next.js 15 App Router API routes (`/api/v1/*`), Dashboard Staff/Admin, Customer Booking Portal, dan Invoice Generator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRISMA SCHEMA VIEWER */}
      {activeTab === 'PRISMA' && (
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-slate-200 font-mono text-xs max-h-[600px] overflow-y-auto">
          <div className="text-slate-500 mb-2">{'// File: /prisma/schema.prisma — PostgreSQL 16 Target'}</div>
          <pre>{`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  STAFF
  ADMIN
}

enum BookingStatus {
  PENDING
  WAITING_PAYMENT
  PAID
  CONFIRMED
  CANCELLED
  REFUND_REQUESTED
  REFUNDED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum PaymentMethod {
  BCA_VA
  MANDIRI_VA
  BRI_VA
  BNI_VA
  QRIS
  CREDIT_CARD
  MANUAL_TRANSFER
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  fullName     String
  role         Role          @default(CUSTOMER)
  phone        String
  bookings     Booking[]
  auditLogs    AuditLog[]
  createdAt    DateTime      @default(now())
}

model TravelSchedule {
  id                      String   @id @default(uuid())
  packageId               String
  departureDate           DateTime
  returnDate              DateTime
  quota                   Int
  remainingQuota          Int
  seasonalSurgeMultiplier Float    @default(1.0)
  bookings                Booking[]

  @@index([packageId, departureDate])
}

model Booking {
  id             String        @id @default(uuid())
  bookingCode    String        @unique
  userId         String
  scheduleId     String
  bookingStatus  BookingStatus @default(WAITING_PAYMENT)
  paymentStatus  PaymentStatus @default(PENDING)
  totalAmount    BigInt
  expiresAt      DateTime
  travelers      Traveler[]
  payments       Payment[]

  @@index([userId, bookingStatus])
}`}</pre>
        </div>
      )}
    </div>
  );
}

import {
  User,
  Destination,
  TravelPackage,
  TravelSchedule,
  Booking,
  Traveler,
  PaymentTransaction,
  Invoice,
  Coupon,
  Review,
  Notification,
  SupportTicket,
  AuditLog,
  PaymentMethod,
  UserRole,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_DESTINATIONS,
  INITIAL_PACKAGES,
  INITIAL_SCHEDULES,
  INITIAL_COUPONS,
  INITIAL_BOOKINGS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_AUDIT_LOGS,
} from './seed-data';

interface TravelStoreState {
  users: User[];
  destinations: Destination[];
  packages: TravelPackage[];
  schedules: TravelSchedule[];
  bookings: Booking[];
  transactions: PaymentTransaction[];
  invoices: Invoice[];
  coupons: Coupon[];
  reviews: Review[];
  notifications: Notification[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  processedIdempotencyKeys: Set<string>;
}

// Global state container for Node.js process and client singleton
declare global {
  var __TRAVEL_STORE_INSTANCE: TravelStore | undefined;
}

export class TravelStore {
  private state: TravelStoreState;
  private listeners: Set<() => void> = new Set();
  private isClient = typeof window !== 'undefined';
  private storageKey = 'nusantara_travel_system_v1';

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): TravelStoreState {
    if (this.isClient) {
      try {
        const cached = localStorage.getItem(this.storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            ...parsed,
            processedIdempotencyKeys: new Set(parsed.processedIdempotencyKeys || []),
          };
        }
      } catch (e) {
        console.warn('Failed to parse cached travel store state:', e);
      }
    }

    // Build initial invoices from confirmed initial bookings
    const initialInvoices: Invoice[] = INITIAL_BOOKINGS.filter((b) => b.paymentStatus === 'PAID').map((b) => ({
      id: `inv-${b.id}`,
      invoiceNumber: b.invoiceNumber || `INV-2026-00000${b.id.slice(-1)}`,
      bookingId: b.id,
      bookingCode: b.bookingCode,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      packageTitle: b.packageTitle,
      scheduleDates: `${b.departureDate} to ${b.returnDate}`,
      totalTravelers: b.totalTravelers,
      unitPrice: b.unitPrice,
      subtotal: b.subtotal,
      discount: b.discount,
      tax: b.tax,
      serviceFee: b.serviceFee,
      totalAmount: b.totalAmount,
      paymentMethod: b.paymentMethod || 'BCA_VA',
      paymentReference: `PAY-REF-${b.bookingCode}`,
      issuedAt: b.paidAt || b.createdAt,
      dueDate: b.departureDate,
      status: 'PAID',
    }));

    return {
      users: [...INITIAL_USERS],
      destinations: [...INITIAL_DESTINATIONS],
      packages: [...INITIAL_PACKAGES],
      schedules: [...INITIAL_SCHEDULES],
      bookings: [...INITIAL_BOOKINGS],
      transactions: [],
      invoices: initialInvoices,
      coupons: [...INITIAL_COUPONS],
      reviews: [...INITIAL_REVIEWS],
      notifications: [...INITIAL_NOTIFICATIONS],
      tickets: [...INITIAL_SUPPORT_TICKETS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      processedIdempotencyKeys: new Set(),
    };
  }

  private persist() {
    if (this.isClient) {
      try {
        const serialized = {
          ...this.state,
          processedIdempotencyKeys: Array.from(this.state.processedIdempotencyKeys),
        };
        localStorage.setItem(this.storageKey, JSON.stringify(serialized));
      } catch (e) {
        console.warn('Failed to persist travel store state:', e);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in travel store listener:', e);
      }
    }
  }

  public resetToDefault() {
    if (this.isClient) {
      localStorage.removeItem(this.storageKey);
    }
    this.state = this.loadInitialState();
    this.persist();
  }

  // AUDIT LOG HELPER
  public logAudit(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    entity: string,
    entityId: string,
    newValue?: string,
    oldValue?: string
  ) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      ipAddress: '127.0.0.1 (API Gateway)',
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 200);
    }
    this.persist();
  }

  // NOTIFICATION HELPER
  public addNotification(
    title: string,
    message: string,
    type: 'BOOKING' | 'PAYMENT' | 'REMINDER' | 'SYSTEM' | 'PROMO',
    userId?: string
  ) {
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.state.notifications.unshift(notif);
    this.persist();
  }

  // USERS
  public getUsers(): User[] {
    return [...this.state.users];
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  // DESTINATIONS
  public getDestinations(search?: string, category?: string): Destination[] {
    return this.state.destinations.filter((d) => {
      const matchSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.city.toLowerCase().includes(search.toLowerCase()) ||
        d.country.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !category || category === 'ALL' || d.category === category;
      return matchSearch && matchCategory && d.status === 'ACTIVE';
    });
  }

  public getAllDestinationsAdmin(): Destination[] {
    return [...this.state.destinations];
  }

  public getDestinationBySlug(slug: string): Destination | undefined {
    return this.state.destinations.find((d) => d.slug === slug);
  }

  public createDestination(dest: Omit<Destination, 'id' | 'createdAt'>, actor: User): Destination {
    const newDest: Destination = {
      ...dest,
      id: `dest-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.destinations.unshift(newDest);
    this.logAudit(actor.id, actor.fullName, actor.role, 'CREATE_DESTINATION', 'Destination', newDest.id, `Created ${newDest.name}`);
    this.persist();
    return newDest;
  }

  public updateDestination(id: string, updates: Partial<Destination>, actor: User): Destination | null {
    const index = this.state.destinations.findIndex((d) => d.id === id);
    if (index === -1) return null;
    const old = this.state.destinations[index];
    const updated = { ...old, ...updates };
    this.state.destinations[index] = updated;
    this.logAudit(actor.id, actor.fullName, actor.role, 'UPDATE_DESTINATION', 'Destination', id, JSON.stringify(updates));
    this.persist();
    return updated;
  }

  public deleteDestination(id: string, actor: User): boolean {
    const index = this.state.destinations.findIndex((d) => d.id === id);
    if (index === -1) return false;
    const name = this.state.destinations[index].name;
    this.state.destinations[index].status = 'INACTIVE';
    this.logAudit(actor.id, actor.fullName, actor.role, 'SOFT_DELETE_DESTINATION', 'Destination', id, `Deactivated ${name}`);
    this.persist();
    return true;
  }

  // TRAVEL PACKAGES
  public getPackages(filters?: {
    search?: string;
    destinationId?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    durationDays?: number;
    featured?: boolean;
  }): TravelPackage[] {
    return this.state.packages.filter((pkg) => {
      if (pkg.status !== 'ACTIVE') return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const match =
          pkg.title.toLowerCase().includes(q) ||
          pkg.description.toLowerCase().includes(q) ||
          pkg.destinationName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filters?.destinationId && pkg.destinationId !== filters.destinationId) return false;
      if (filters?.category && filters.category !== 'ALL' && pkg.category !== filters.category) return false;
      if (filters?.minPrice && (pkg.discountPrice || pkg.price) < filters.minPrice) return false;
      if (filters?.maxPrice && (pkg.discountPrice || pkg.price) > filters.maxPrice) return false;
      if (filters?.featured !== undefined && pkg.featured !== filters.featured) return false;
      return true;
    });
  }

  public getAllPackagesAdmin(): TravelPackage[] {
    return [...this.state.packages];
  }

  public getPackageBySlug(slug: string): TravelPackage | undefined {
    return this.state.packages.find((p) => p.slug === slug);
  }

  public getPackageById(id: string): TravelPackage | undefined {
    return this.state.packages.find((p) => p.id === id);
  }

  public createPackage(pkg: Omit<TravelPackage, 'id' | 'createdAt'>, actor: User): TravelPackage {
    const dest = this.state.destinations.find((d) => d.id === pkg.destinationId);
    const newPackage: TravelPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      destinationName: dest ? dest.name : 'Indonesia',
      createdAt: new Date().toISOString(),
    };
    this.state.packages.unshift(newPackage);
    this.logAudit(actor.id, actor.fullName, actor.role, 'CREATE_PACKAGE', 'TravelPackage', newPackage.id, `Created ${newPackage.title}`);
    this.persist();
    return newPackage;
  }

  public updatePackage(id: string, updates: Partial<TravelPackage>, actor: User): TravelPackage | null {
    const index = this.state.packages.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const old = this.state.packages[index];
    const updated = { ...old, ...updates };
    this.state.packages[index] = updated;
    this.logAudit(actor.id, actor.fullName, actor.role, 'UPDATE_PACKAGE', 'TravelPackage', id, `Updated package ${updated.title}`);
    this.persist();
    return updated;
  }

  public deletePackage(id: string, actor: User): boolean {
    const index = this.state.packages.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.state.packages[index].status = 'INACTIVE';
    this.logAudit(actor.id, actor.fullName, actor.role, 'SOFT_DELETE_PACKAGE', 'TravelPackage', id, 'Deactivated package');
    this.persist();
    return true;
  }

  // SCHEDULES & INVENTORY
  public getSchedules(packageId?: string): TravelSchedule[] {
    if (packageId) {
      return this.state.schedules.filter((s) => s.packageId === packageId);
    }
    return [...this.state.schedules];
  }

  public getScheduleById(id: string): TravelSchedule | undefined {
    return this.state.schedules.find((s) => s.id === id);
  }

  public createSchedule(sch: Omit<TravelSchedule, 'id'>, actor: User): TravelSchedule {
    const newSch: TravelSchedule = {
      ...sch,
      id: `sch-${Date.now()}`,
    };
    this.state.schedules.unshift(newSch);
    this.logAudit(actor.id, actor.fullName, actor.role, 'CREATE_SCHEDULE', 'TravelSchedule', newSch.id, `Created schedule for package ${sch.packageId}`);
    this.persist();
    return newSch;
  }

  public updateSchedule(id: string, updates: Partial<TravelSchedule>, actor: User): TravelSchedule | null {
    const index = this.state.schedules.findIndex((s) => s.id === id);
    if (index === -1) return null;
    const old = this.state.schedules[index];
    const updated = { ...old, ...updates };
    if (updated.remainingQuota === 0) {
      updated.status = 'FULL';
    } else if (updated.remainingQuota <= 5) {
      updated.status = 'ALMOST_FULL';
    } else {
      updated.status = 'AVAILABLE';
    }
    this.state.schedules[index] = updated;
    this.logAudit(actor.id, actor.fullName, actor.role, 'UPDATE_SCHEDULE', 'TravelSchedule', id, `Updated quota to ${updated.remainingQuota}`);
    this.persist();
    return updated;
  }

  // COUPONS
  public getCoupons(): Coupon[] {
    return [...this.state.coupons];
  }

  public validateCoupon(code: string, subtotal: number): { valid: boolean; discount: number; message: string; coupon?: Coupon } {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.state.coupons.find((c) => c.code === cleanCode);
    if (!coupon) {
      return { valid: false, discount: 0, message: 'Kode kupon promo tidak ditemukan.' };
    }
    if (coupon.status !== 'ACTIVE') {
      return { valid: false, discount: 0, message: 'Kupon promo sudah tidak aktif atau kedaluwarsa.' };
    }
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, message: 'Kuota pemakaian kupon promo sudah habis.' };
    }
    if (subtotal < coupon.minimumTransaction) {
      return {
        valid: false,
        discount: 0,
        message: `Minimal transaksi untuk kupon ini adalah Rp ${coupon.minimumTransaction.toLocaleString('id-ID')}.`,
      };
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    } else {
      discount = coupon.value;
    }

    return {
      valid: true,
      discount,
      message: `Kupon berhasil diterapkan! Anda hemat Rp ${discount.toLocaleString('id-ID')}.`,
      coupon,
    };
  }

  // ==========================================
  // CORE BOOKING ENGINE WITH CONCURRENCY GUARD
  // ==========================================
  public createBooking(payload: {
    userId: string;
    packageId: string;
    scheduleId: string;
    travelers: Omit<Traveler, 'id' | 'bookingId'>[];
    couponCode?: string;
    paymentMethod?: PaymentMethod;
  }): Booking {
    const user = this.state.users.find((u) => u.id === payload.userId);
    if (!user) throw new Error('User not found. Please log in first.');

    const pkg = this.state.packages.find((p) => p.id === payload.packageId);
    if (!pkg || pkg.status !== 'ACTIVE') {
      throw new Error('Travel package is currently inactive or not available.');
    }

    const scheduleIndex = this.state.schedules.findIndex((s) => s.id === payload.scheduleId);
    if (scheduleIndex === -1) {
      throw new Error('Travel schedule not found.');
    }

    const schedule = this.state.schedules[scheduleIndex];
    const totalTravelers = payload.travelers.length;
    if (totalTravelers < 1) {
      throw new Error('At least 1 traveler is required for booking.');
    }

    // CONCURRENCY & OVERSELLING CHECK
    if (schedule.remainingQuota < totalTravelers) {
      throw new Error(
        `CONCURRENCY ERROR: Insufficient quota! Only ${schedule.remainingQuota} seats remaining for schedule ${schedule.departureDate}. Cannot reserve ${totalTravelers} seats.`
      );
    }

    if (schedule.status === 'FULL' || schedule.status === 'CANCELLED') {
      throw new Error(`Schedule is not available for booking (Status: ${schedule.status}).`);
    }

    // ATOMIC QUOTA DEDUCTION
    schedule.remainingQuota -= totalTravelers;
    if (schedule.remainingQuota === 0) {
      schedule.status = 'FULL';
    } else if (schedule.remainingQuota <= 5) {
      schedule.status = 'ALMOST_FULL';
    }

    // Pricing calculation
    const basePrice = (pkg.discountPrice || pkg.price) * (schedule.seasonalSurgeMultiplier || 1.0);
    const subtotal = basePrice * totalTravelers;

    let discount = 0;
    let appliedCoupon: Coupon | undefined;
    if (payload.couponCode) {
      const couponValidation = this.validateCoupon(payload.couponCode, subtotal);
      if (couponValidation.valid && couponValidation.coupon) {
        discount = couponValidation.discount;
        appliedCoupon = couponValidation.coupon;
        appliedCoupon.usageCount += 1;
      }
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.11); // 11% PPN Indonesia
    const serviceFee = 50000; // standard booking fee
    const totalAmount = taxableAmount + tax + serviceFee;

    // Booking Code Generation (e.g. TRV-2026-000006)
    const bookingSequence = this.state.bookings.length + 1;
    const paddedSeq = bookingSequence.toString().padStart(6, '0');
    const bookingCode = `TRV-2026-${paddedSeq}`;
    const bookingId = `bk-2026-${paddedSeq}`;

    // Map travelers with IDs
    const travelersWithIds: Traveler[] = payload.travelers.map((t, idx) => ({
      ...t,
      id: `trv-${bookingId}-${idx + 1}`,
      bookingId,
    }));

    // 15-Minute Expiration Timer for Payment
    const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const newBooking: Booking = {
      id: bookingId,
      bookingCode,
      userId: user.id,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.phone,
      packageId: pkg.id,
      packageTitle: pkg.title,
      destinationName: pkg.destinationName || 'Indonesia',
      scheduleId: schedule.id,
      departureDate: schedule.departureDate,
      returnDate: schedule.returnDate,
      totalTravelers,
      travelers: travelersWithIds,
      unitPrice: basePrice,
      subtotal,
      discount,
      couponCode: appliedCoupon?.code,
      tax,
      serviceFee,
      totalAmount,
      bookingStatus: 'WAITING_PAYMENT',
      paymentStatus: 'PENDING',
      paymentMethod: payload.paymentMethod || 'BCA_VA',
      paymentExpiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.bookings.unshift(newBooking);

    // Audit log
    this.logAudit(
      user.id,
      user.fullName,
      user.role,
      'CREATE_BOOKING',
      'Booking',
      bookingId,
      `Reserved ${totalTravelers} seats on ${schedule.departureDate}. Quota remaining: ${schedule.remainingQuota}`
    );

    // In-app notification
    this.addNotification(
      'Booking Created — Waiting Payment',
      `Booking ${bookingCode} created for ${pkg.title}. Please complete payment within 15 minutes.`,
      'PAYMENT',
      user.id
    );

    this.persist();
    return newBooking;
  }

  // SIMULATE CONCURRENT BOOKINGS FOR TESTING ATOMICITY
  public simulateConcurrentBookings(scheduleId: string, concurrentRequestCount: number): {
    successful: number;
    failed: number;
    remainingQuota: number;
    logs: string[];
  } {
    const logs: string[] = [];
    let successful = 0;
    let failed = 0;

    const schedule = this.state.schedules.find((s) => s.id === scheduleId);
    if (!schedule) {
      return { successful: 0, failed: 0, remainingQuota: 0, logs: ['Schedule not found'] };
    }

    const demoUser = this.state.users.find((u) => u.role === 'CUSTOMER') || this.state.users[0];

    logs.push(`Initiating ${concurrentRequestCount} concurrent requests for Schedule ${scheduleId}. Initial Quota: ${schedule.remainingQuota}`);

    for (let i = 1; i <= concurrentRequestCount; i++) {
      try {
        this.createBooking({
          userId: demoUser.id,
          packageId: schedule.packageId,
          scheduleId: schedule.id,
          travelers: [
            {
              fullName: `Stress Test Traveler ${i}`,
              type: 'ADULT',
              gender: 'MALE',
              dateOfBirth: '1995-01-01',
              nationality: 'Indonesian',
              identityNumber: `31710000000000${i}`,
            },
          ],
        });
        successful++;
        logs.push(`[REQ #${i}] SUCCESS: Seat reserved. Remaining quota: ${schedule.remainingQuota}`);
      } catch (err: any) {
        failed++;
        logs.push(`[REQ #${i}] REJECTED BY LOCK: ${err.message}`);
      }
    }

    this.logAudit(
      demoUser.id,
      'System Benchmark Runner',
      'ADMIN',
      'CONCURRENCY_TEST',
      'TravelSchedule',
      scheduleId,
      `Ran ${concurrentRequestCount} requests: ${successful} granted, ${failed} prevented from overselling.`
    );

    return {
      successful,
      failed,
      remainingQuota: schedule.remainingQuota,
      logs,
    };
  }

  // PAYMENT PROCESSING & IDEMPOTENCY
  public processPayment(payload: {
    bookingId: string;
    method: PaymentMethod;
    idempotencyKey?: string;
  }): { booking: Booking; invoice: Invoice; transaction: PaymentTransaction } {
    const booking = this.state.bookings.find((b) => b.id === payload.bookingId);
    if (!booking) throw new Error('Booking not found.');

    if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'COMPLETED') {
      throw new Error(`Cannot process payment for booking with status ${booking.bookingStatus}.`);
    }

    // Idempotency check
    const idempKey = payload.idempotencyKey || `idem-${booking.id}-${payload.method}`;
    if (this.state.processedIdempotencyKeys.has(idempKey)) {
      const existingInv = this.state.invoices.find((i) => i.bookingId === booking.id);
      const existingTx = this.state.transactions.find((t) => t.idempotencyKey === idempKey);
      if (existingInv && existingTx) {
        return { booking, invoice: existingInv, transaction: existingTx };
      }
    }

    // Check expiration
    if (booking.bookingStatus === 'WAITING_PAYMENT' && new Date() > new Date(booking.paymentExpiresAt)) {
      throw new Error('Payment time expired (15-minute window has elapsed). Booking has expired.');
    }

    const nowIso = new Date().toISOString();
    booking.bookingStatus = 'CONFIRMED';
    booking.paymentStatus = 'PAID';
    booking.paymentMethod = payload.method;
    booking.paidAt = nowIso;
    booking.confirmedAt = nowIso;
    booking.updatedAt = nowIso;

    // Generate Invoice Number (e.g. INV-2026-000006)
    const invSeq = this.state.invoices.length + 1;
    const invNumber = `INV-2026-${invSeq.toString().padStart(6, '0')}`;
    booking.invoiceNumber = invNumber;

    const invoice: Invoice = {
      id: `inv-${booking.id}`,
      invoiceNumber: invNumber,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      packageTitle: booking.packageTitle,
      scheduleDates: `${booking.departureDate} to ${booking.returnDate}`,
      totalTravelers: booking.totalTravelers,
      unitPrice: booking.unitPrice,
      subtotal: booking.subtotal,
      discount: booking.discount,
      tax: booking.tax,
      serviceFee: booking.serviceFee,
      totalAmount: booking.totalAmount,
      paymentMethod: payload.method,
      paymentReference: `TX-NUSA-${Date.now()}`,
      issuedAt: nowIso,
      dueDate: booking.departureDate,
      status: 'PAID',
    };
    this.state.invoices.unshift(invoice);

    const transaction: PaymentTransaction = {
      id: `tx-${Date.now()}`,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      amount: booking.totalAmount,
      method: payload.method,
      status: 'PAID',
      referenceNumber: invoice.paymentReference,
      idempotencyKey: idempKey,
      paidAt: nowIso,
      expiredAt: booking.paymentExpiresAt,
      createdAt: nowIso,
    };
    this.state.transactions.unshift(transaction);
    this.state.processedIdempotencyKeys.add(idempKey);

    this.logAudit(
      booking.userId,
      booking.customerName,
      'CUSTOMER',
      'PAYMENT_SUCCESS',
      'Payment',
      booking.id,
      `Paid Rp ${booking.totalAmount.toLocaleString('id-ID')} via ${payload.method}. Invoice ${invNumber} generated.`
    );

    this.addNotification(
      'Payment Received & Booking Confirmed',
      `Payment of Rp ${booking.totalAmount.toLocaleString('id-ID')} received for ${booking.bookingCode}. Your e-ticket & invoice are now ready.`,
      'BOOKING',
      booking.userId
    );

    this.persist();
    return { booking, invoice, transaction };
  }

  // CANCEL BOOKING & RETURN QUOTA
  public cancelBooking(bookingId: string, reason: string, actor: User): Booking {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');

    if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'COMPLETED') {
      throw new Error(`Booking cannot be cancelled in ${booking.bookingStatus} status.`);
    }

    const previousStatus = booking.bookingStatus;
    booking.bookingStatus = 'CANCELLED';
    booking.cancelledAt = new Date().toISOString();
    booking.cancelReason = reason;
    booking.updatedAt = new Date().toISOString();

    // RETURN QUOTA TO SCHEDULE!
    const schedule = this.state.schedules.find((s) => s.id === booking.scheduleId);
    if (schedule) {
      schedule.remainingQuota += booking.totalTravelers;
      if (schedule.remainingQuota > 5) {
        schedule.status = 'AVAILABLE';
      } else if (schedule.remainingQuota > 0) {
        schedule.status = 'ALMOST_FULL';
      }
    }

    this.logAudit(
      actor.id,
      actor.fullName,
      actor.role,
      'CANCEL_BOOKING',
      'Booking',
      bookingId,
      `Cancelled: ${reason}. Returned ${booking.totalTravelers} seats to schedule ${booking.scheduleId}.`,
      previousStatus
    );

    this.addNotification(
      'Booking Cancelled',
      `Booking ${booking.bookingCode} has been cancelled. Reason: ${reason}.`,
      'BOOKING',
      booking.userId
    );

    this.persist();
    return booking;
  }

  // REFUND WORKFLOW
  public requestRefund(bookingId: string, reason: string, actor: User): Booking {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');

    if (booking.paymentStatus !== 'PAID') {
      throw new Error('Only paid bookings are eligible for refund requests.');
    }

    booking.bookingStatus = 'REFUND_REQUESTED';
    booking.refundStatus = 'REQUESTED';
    booking.cancelReason = reason;
    // Apply 80% refund standard according to cancellation policy
    booking.refundAmount = Math.round(booking.totalAmount * 0.8);
    booking.updatedAt = new Date().toISOString();

    this.logAudit(
      actor.id,
      actor.fullName,
      actor.role,
      'REQUEST_REFUND',
      'Booking',
      bookingId,
      `Requested refund of Rp ${booking.refundAmount.toLocaleString('id-ID')} (${reason})`
    );

    this.addNotification(
      'Refund Request Submitted',
      `Refund request for booking ${booking.bookingCode} has been submitted for review.`,
      'BOOKING',
      booking.userId
    );

    this.persist();
    return booking;
  }

  public processRefundDecision(bookingId: string, decision: 'APPROVE' | 'REJECT', notes: string, actor: User): Booking {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');

    if (decision === 'APPROVE') {
      booking.refundStatus = 'COMPLETED';
      booking.bookingStatus = 'REFUNDED';
      booking.paymentStatus = 'REFUNDED';

      // Return quota if not already completed
      const schedule = this.state.schedules.find((s) => s.id === booking.scheduleId);
      if (schedule) {
        schedule.remainingQuota += booking.totalTravelers;
        if (schedule.remainingQuota > 5) schedule.status = 'AVAILABLE';
      }

      this.logAudit(
        actor.id,
        actor.fullName,
        actor.role,
        'APPROVE_REFUND',
        'Booking',
        bookingId,
        `Approved refund Rp ${booking.refundAmount?.toLocaleString('id-ID')}. Notes: ${notes}`
      );

      this.addNotification(
        'Refund Approved',
        `Refund for ${booking.bookingCode} has been approved and processed back to your original payment method.`,
        'PAYMENT',
        booking.userId
      );
    } else {
      booking.refundStatus = 'REJECTED';
      booking.bookingStatus = 'CONFIRMED';

      this.logAudit(
        actor.id,
        actor.fullName,
        actor.role,
        'REJECT_REFUND',
        'Booking',
        bookingId,
        `Rejected refund. Notes: ${notes}`
      );

      this.addNotification(
        'Refund Request Declined',
        `Refund request for ${booking.bookingCode} was declined. Reason: ${notes}`,
        'PAYMENT',
        booking.userId
      );
    }

    booking.updatedAt = new Date().toISOString();
    this.persist();
    return booking;
  }

  public approveRefund(bookingId: string, notes: string, actor: User): Booking {
    return this.processRefundDecision(bookingId, 'APPROVE', notes, actor);
  }

  public rejectRefund(bookingId: string, notes: string, actor: User): Booking {
    return this.processRefundDecision(bookingId, 'REJECT', notes, actor);
  }

  public addReview(payload: {
    bookingId: string;
    packageId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }): Review {
    const user: User = this.getUserById(payload.userId) || {
      id: payload.userId,
      fullName: payload.userName,
      email: '',
      role: 'CUSTOMER' as UserRole,
      phone: '',
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    return this.createReview({
      bookingId: payload.bookingId,
      rating: payload.rating,
      comment: payload.comment,
      actor: user,
    });
  }

  // BOOKINGS QUERY
  public getBookings(filters?: { userId?: string; status?: string; search?: string }): Booking[] {
    return this.state.bookings.filter((b) => {
      if (filters?.userId && b.userId !== filters.userId) return false;
      if (filters?.status && filters.status !== 'ALL' && b.bookingStatus !== filters.status) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const match =
          b.bookingCode.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerEmail.toLowerCase().includes(q) ||
          b.packageTitle.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }

  public getBookingById(id: string): Booking | undefined {
    return this.state.bookings.find((b) => b.id === id || b.bookingCode === id);
  }

  public getInvoiceByBookingId(bookingId: string): Invoice | undefined {
    return this.state.invoices.find((i) => i.bookingId === bookingId || i.bookingCode === bookingId);
  }

  // REVIEWS
  public getReviews(packageId?: string): Review[] {
    if (packageId) {
      return this.state.reviews.filter((r) => r.packageId === packageId && r.status === 'APPROVED');
    }
    return [...this.state.reviews];
  }

  public createReview(payload: {
    bookingId: string;
    rating: number;
    comment: string;
    actor: User;
  }): Review {
    const booking = this.state.bookings.find((b) => b.id === payload.bookingId);
    if (!booking) throw new Error('Booking not found.');

    if (booking.bookingStatus !== 'COMPLETED' && booking.bookingStatus !== 'CONFIRMED') {
      throw new Error('Reviews can only be submitted for completed or confirmed trips.');
    }

    const review: Review = {
      id: `rev-${Date.now()}`,
      bookingId: booking.id,
      packageId: booking.packageId,
      packageTitle: booking.packageTitle,
      userId: payload.actor.id,
      userName: payload.actor.fullName,
      userAvatar: payload.actor.avatarUrl,
      rating: payload.rating,
      comment: payload.comment,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };

    this.state.reviews.unshift(review);
    this.logAudit(
      payload.actor.id,
      payload.actor.fullName,
      payload.actor.role,
      'SUBMIT_REVIEW',
      'Review',
      review.id,
      `Submitted ${payload.rating}-star review for ${booking.packageTitle}`
    );

    this.persist();
    return review;
  }

  // SUPPORT TICKETS
  public getSupportTickets(userId?: string): SupportTicket[] {
    if (userId) {
      return this.state.tickets.filter((t) => t.userId === userId);
    }
    return [...this.state.tickets];
  }

  public createSupportTicket(payload: {
    subject: string;
    category: SupportTicket['category'];
    priority: SupportTicket['priority'];
    initialMessage: string;
    actor: User;
  }): SupportTicket {
    const seq = this.state.tickets.length + 1;
    const ticketCode = `TKT-2026-${seq.toString().padStart(3, '0')}`;
    const ticketId = `tkt-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newTicket: SupportTicket = {
      id: ticketId,
      ticketCode,
      userId: payload.actor.id,
      userName: payload.actor.fullName,
      userEmail: payload.actor.email,
      subject: payload.subject,
      category: payload.category,
      priority: payload.priority,
      status: 'OPEN',
      messages: [
        {
          id: `msg-${Date.now()}`,
          ticketId,
          senderId: payload.actor.id,
          senderName: payload.actor.fullName,
          senderRole: payload.actor.role,
          message: payload.initialMessage,
          createdAt: nowIso,
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.state.tickets.unshift(newTicket);
    this.logAudit(payload.actor.id, payload.actor.fullName, payload.actor.role, 'CREATE_TICKET', 'SupportTicket', ticketId, payload.subject);
    this.persist();
    return newTicket;
  }

  public replySupportTicket(ticketId: string, message: string, actor: User): SupportTicket {
    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found.');

    const nowIso = new Date().toISOString();
    ticket.messages.push({
      id: `msg-${Date.now()}`,
      ticketId,
      senderId: actor.id,
      senderName: actor.fullName,
      senderRole: actor.role,
      message,
      createdAt: nowIso,
    });

    if (actor.role === 'STAFF' || actor.role === 'ADMIN') {
      ticket.status = 'WAITING_CUSTOMER';
    } else {
      ticket.status = 'IN_PROGRESS';
    }
    ticket.updatedAt = nowIso;

    this.persist();
    return ticket;
  }

  public getTickets(userId?: string): SupportTicket[] {
    return this.getSupportTickets(userId);
  }

  public replyTicket(ticketId: string, message: string, actor: User): SupportTicket {
    return this.replySupportTicket(ticketId, message, actor);
  }

  public resetToSeed() {
    this.resetToDefault();
  }

  public updateTicketStatus(ticketId: string, status: SupportTicket['status'], actor: User): SupportTicket {
    const ticket = this.state.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found.');
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    this.logAudit(actor.id, actor.fullName, actor.role, 'UPDATE_TICKET_STATUS', 'SupportTicket', ticketId, `Changed status to ${status}`);
    this.persist();
    return ticket;
  }

  // NOTIFICATIONS
  public getNotifications(userId?: string): Notification[] {
    if (userId) {
      return this.state.notifications.filter((n) => !n.userId || n.userId === userId);
    }
    return [...this.state.notifications];
  }

  public markNotificationRead(id: string) {
    const notif = this.state.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsRead() {
    this.state.notifications.forEach((n) => (n.isRead = true));
    this.persist();
  }

  // AUDIT LOGS
  public getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs];
  }

  // ANALYTICS & REPORTS
  public getAnalyticsDashboard() {
    const totalBookings = this.state.bookings.length;
    const paidBookings = this.state.bookings.filter((b) => b.paymentStatus === 'PAID');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const pendingPayments = this.state.bookings.filter((b) => b.bookingStatus === 'WAITING_PAYMENT').length;
    const confirmedBookings = this.state.bookings.filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'COMPLETED').length;
    const refundRequests = this.state.bookings.filter((b) => b.refundStatus === 'REQUESTED').length;

    // Monthly revenue simulation
    const monthlyRevenue = [
      { month: 'Apr 2026', revenue: 42000000, bookings: 12 },
      { month: 'May 2026', revenue: 58500000, bookings: 18 },
      { month: 'Jun 2026', revenue: 76000000, bookings: 24 },
      { month: 'Jul 2026', revenue: 98000000, bookings: 31 },
      { month: 'Aug 2026', revenue: 114000000, bookings: 38 },
      { month: 'Sep 2026', revenue: totalRevenue, bookings: totalBookings },
    ];

    // Destination popularity
    const destinationStats = this.state.destinations.map((d) => {
      const packageIds = this.state.packages.filter((p) => p.destinationId === d.id).map((p) => p.id);
      const bookedCount = this.state.bookings.filter((b) => packageIds.includes(b.packageId)).length;
      return {
        name: d.name,
        city: d.city,
        bookings: bookedCount,
        rating: d.rating,
      };
    });

    return {
      totalRevenue,
      totalBookings,
      confirmedBookings,
      pendingPayments,
      refundRequests,
      activeUsers: this.state.users.length,
      monthlyRevenue,
      destinationStats,
      recentBookings: this.state.bookings.slice(0, 5),
      recentAuditLogs: this.state.auditLogs.slice(0, 5),
    };
  }
}

// Global Singleton instantiation
export function getTravelStore(): TravelStore {
  if (typeof window !== 'undefined') {
    if (!window.__TRAVEL_STORE_INSTANCE) {
      window.__TRAVEL_STORE_INSTANCE = new TravelStore();
    }
    return window.__TRAVEL_STORE_INSTANCE;
  }

  if (!global.__TRAVEL_STORE_INSTANCE) {
    global.__TRAVEL_STORE_INSTANCE = new TravelStore();
  }
  return global.__TRAVEL_STORE_INSTANCE;
}

export const travelStore = getTravelStore();

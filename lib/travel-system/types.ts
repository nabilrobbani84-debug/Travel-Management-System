export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'RESERVED'
  | 'WAITING_PAYMENT'
  | 'PAID'
  | 'CONFIRMED'
  | 'ON_TRIP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'BCA_VA'
  | 'MANDIRI_VA'
  | 'BRI_VA'
  | 'BNI_VA'
  | 'QRIS'
  | 'GOPAY'
  | 'OVO'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'MANUAL_TRANSFER';

export type ScheduleStatus =
  | 'AVAILABLE'
  | 'ALMOST_FULL'
  | 'FULL'
  | 'CANCELLED'
  | 'COMPLETED';

export type TravelerType = 'ADULT' | 'CHILD' | 'INFANT';

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type CurrencyCode = 'IDR' | 'USD' | 'SGD' | 'MYR';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  isVerified: boolean;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string;
  description: string;
  latitude: number;
  longitude: number;
  timezone: string;
  category: 'BEACH' | 'MOUNTAIN' | 'CULTURAL' | 'NATURE' | 'ADVENTURE' | 'URBAN';
  imageUrl: string;
  gallery: string[];
  featured: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  rating: number;
  packageCount?: number;
  createdAt: string;
}

export interface ItineraryItem {
  dayNumber: number;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  meal: string;
  transport: string;
  accommodation: string;
}

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  roomType: string;
  location: string;
  facilities: string[];
  imageUrl: string;
}

export interface Transport {
  id: string;
  type: 'FLIGHT' | 'BUS' | 'SPEEDBOAT' | 'PRIVATE_CAR' | 'TRAIN';
  provider: string;
  vehicle: string;
  seatCapacity: number;
}

export interface TravelPackage {
  id: string;
  destinationId: string;
  destinationName?: string;
  title: string;
  slug: string;
  description: string;
  duration: string; // e.g. "4D3N"
  durationDays: number;
  startLocation: string;
  endLocation: string;
  price: number; // in IDR
  discountPrice?: number;
  quota: number;
  availableQuota: number;
  minimumParticipant: number;
  maximumParticipant: number;
  status: 'ACTIVE' | 'INACTIVE';
  featured: boolean;
  category: string;
  cancellationPolicy: string;
  imageUrl: string;
  gallery: string[];
  itinerary: ItineraryItem[];
  hotels: Hotel[];
  transports: Transport[];
  inclusions: string[];
  exclusions: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface TravelSchedule {
  id: string;
  packageId: string;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  quota: number;
  remainingQuota: number;
  status: ScheduleStatus;
  seasonalSurgeMultiplier?: number; // e.g. 1.1 for holiday season
}

export interface Traveler {
  id: string;
  bookingId?: string;
  fullName: string;
  type: TravelerType;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  nationality: string;
  identityNumber: string;
  passportNumber?: string;
  passportExpired?: string;
  phone?: string;
  email?: string;
  specialRequest?: string;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. TRV-2026-000001
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: string;
  packageTitle: string;
  destinationName: string;
  scheduleId: string;
  departureDate: string;
  returnDate: string;
  totalTravelers: number;
  travelers: Traveler[];
  unitPrice: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number; // 11% PPN
  serviceFee: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentExpiresAt: string; // ISO String
  paidAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  refundAmount?: number;
  refundStatus?: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  bookingCode: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  vaNumber?: string;
  qrPayload?: string;
  referenceNumber: string;
  idempotencyKey: string;
  gatewayResponse?: any;
  paidAt?: string;
  expiredAt: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-000001
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageTitle: string;
  scheduleDates: string;
  totalTravelers: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  tax: number;
  serviceFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  issuedAt: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'VOID';
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // percentage (e.g. 15 for 15%) or fixed amount (e.g. 500000)
  minimumTransaction: number;
  maximumDiscount?: number;
  usageLimit: number;
  usageCount: number;
  userLimit: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED';
}

export interface Review {
  id: string;
  bookingId: string;
  packageId: string;
  packageTitle: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'PAYMENT' | 'REMINDER' | 'SYSTEM' | 'PROMO';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketCode: string; // e.g. TKT-001
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: 'BOOKING' | 'PAYMENT' | 'SCHEDULE' | 'REFUND' | 'GENERAL';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

# Travel Management System — Advanced Backend Engineering

An enterprise-grade, scalable, and secure **Travel Management System** platform engineered for high-concurrency booking workflows, atomic inventory reservation, distributed payment processing, and comprehensive operational management.

---

## 🏛️ System Architecture

The application adopts Clean Architecture principles separating Domain, Application, Infrastructure, and Presentation layers:

```
src/
├── domain/                  # Pure Business Entities & Rules
│   ├── entities/            # Destination, Package, Schedule, Booking, Traveler, Payment
│   └── value-objects/       # BookingCode, IdempotencyKey, CurrencyAmount
├── application/             # Use Cases & Orchestration
│   ├── booking-engine/      # Concurrency Mutex & Quota Reservation
│   ├── payment-service/     # Payment Gateway Abstraction (VA, QRIS, CC)
│   └── notification/        # Event-driven Multi-channel Dispatcher
├── infrastructure/          # External Integrations & Storage
│   ├── database/            # PostgreSQL 16 + Prisma ORM (28+ tables, composite indexes)
│   ├── cache/               # Redis 7 (Rate limiting, distributed locks, session caching)
│   ├── queue/               # BullMQ (Booking 15-minute expiration, email, reporting)
│   └── storage/             # S3 / MinIO Object Storage for vouchers & media
└── presentation/            # API Endpoints & Administrative Interface
    ├── api/v1/              # RESTful API with standardized responses & HTTP status codes
    └── dashboard/           # Next.js & Tailwind modern operations console
```

---

## 🚀 Key Functional Modules

1. **Atomic Inventory & Concurrency Management**
   - Prevents seat overselling through atomic row-level locks and transaction rollback.
   - 15-minute reservation TTL: uncompleted bookings automatically expire and return quota to the inventory pool.
   - Built-in stress test runner demonstrating race-condition resilience.

2. **Booking & Traveler Lifecycle**
   - Workflow: `PENDING` → `RESERVED` → `WAITING_PAYMENT` → `PAID` → `CONFIRMED` → `ON_TRIP` → `COMPLETED`.
   - Multi-traveler support (`ADULT`, `CHILD`, `INFANT`) with identity and special dietary requests.
   - Standardized booking code generation (`TRV-YYYY-XXXXXX`).

3. **Payment Gateway & Idempotency**
   - Abstract payment gateway interface supporting Indonesian Virtual Accounts (BCA, Mandiri, BNI, BRI), QRIS, and Credit Cards.
   - `Idempotency-Key` header verification prevents duplicate transactions.
   - Instant printable/downloadable invoice generation (`INV-YYYY-XXXXXX`).

4. **Role-Based Access Control (RBAC)**
   - **Customer**: Destination exploration, booking, payment, traveler management, support ticket desk, and invoice access.
   - **Staff**: Booking verification, schedule and quota administration, payment confirmation, refund processing, and support response.
   - **Admin**: Full system management, revenue analytics, package configuration, promo management, and audit log inspection.

5. **Observability & Audit Trail**
   - Structured JSON logging with correlation IDs.
   - Immutable audit logs tracking all critical mutations (Actor, Action, Entity, Old/New values, IP address, timestamp).
   - `/api/v1/health` endpoint reporting database, redis, and queue vitals.

---

## 🛠️ API Reference (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health, database, and cache readiness check |
| `GET` | `/api/v1/destinations` | List active destinations with search & category filters |
| `POST` | `/api/v1/destinations` | Create new travel destination (Admin/Staff) |
| `GET` | `/api/v1/packages` | List travel packages with price/duration/featured filters |
| `POST` | `/api/v1/packages` | Create new travel package with itinerary |
| `GET` | `/api/v1/schedules` | List departure schedules and real-time available quota |
| `POST` | `/api/v1/schedules` | Create departure schedule for a package |
| `GET` | `/api/v1/bookings` | List bookings with status and user filtering |
| `POST` | `/api/v1/bookings` | Create booking with atomic quota reservation |
| `POST` | `/api/v1/payments` | Process payment with Idempotency Key verification |
| `GET` | `/api/v1/refunds` | List refund requests and status |
| `POST` | `/api/v1/refunds` | Submit cancellation refund request |
| `GET` | `/api/v1/analytics/dashboard` | Revenue, booking trends, and destination metrics |
| `GET` | `/api/v1/audit-logs` | Immutable system audit log trail |

---

## 🐳 Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/travel/travel-management-system.git
cd travel-management-system

# Start PostgreSQL, Redis, MinIO, and the Application
docker compose up -d

# Verify running containers
docker compose ps
```

The system will be accessible at:
- Web App & Dashboard: `http://localhost:3000`
- REST API: `http://localhost:3000/api/v1`
- MinIO S3 Console: `http://localhost:9001`

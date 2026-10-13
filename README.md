# Hardware Shop Inventory, Sales, Billing and Customer Management System

[![Java](https://img.shields.io/badge/Java-21_LTS-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.4-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Build & Test](https://img.shields.io/badge/Tests-21_Passed-success.svg)]()

A complete, production-grade **Hardware Shop Inventory, Sales, Billing, Customer Management, and Live Notification System** built as a modern monorepo:
* **Backend:** Java 21, Spring Boot 3.3.4, Spring Security 6 (stateless JWT), Spring Data JPA, Hibernate, MySQL 8.4, OpenPDF, SpringDoc OpenAPI 2.6.0.
* **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide Icons, Axios, React Router v7.
* **Notifications:** Official Twilio Messages REST API (WhatsApp & SMS) and Meta WhatsApp Cloud API v20.0 with automatic failover and audit trail.
* **DevOps:** Multi-stage Dockerfiles for backend (Temurin JRE) and frontend (Nginx 1.27), orchestrated with Docker Compose.

---

## Table of Contents

1. [Monorepo Architecture](#monorepo-architecture)
2. [Key Features & Business Invariants](#key-features--business-invariants)
3. [Technology Stack](#technology-stack)
4. [Live Notification Providers](#live-notification-providers)
5. [Database Design & Schemas](#database-design--schemas)
6. [User Roles & Security](#user-roles--security)
7. [API Specification & Swagger](#api-specification--swagger)
8. [Getting Started (Local Development)](#getting-started-local-development)
9. [Running Automated Tests](#running-automated-tests)
10. [Docker Container Orchestration](#docker-container-orchestration)
11. [Environment Variables Reference](#environment-variables-reference)
12. [Cloud Deployment Guide](#cloud-deployment-guide)

---

## Monorepo Architecture

```text
hardware-shop-management-system/
├── backend/                                  # Spring Boot 3.3.4 (Java 21)
│   ├── Dockerfile                           # Multi-stage Temurin 21 build
│   ├── pom.xml                              # Maven dependencies
│   └── src/
│       ├── main/java/com/hardwareshop/
│       │   ├── config/                      # WebMvc, Storage & Async config
│       │   ├── controller/                  # REST Controllers (Auth, Product, Sale, Dashboard, etc.)
│       │   ├── dto/                         # Request & Response DTOs
│       │   ├── entity/                      # JPA Entities (Product, Sale, Customer, NotificationLog)
│       │   ├── exception/                   # @RestControllerAdvice Global Handler
│       │   ├── notification/                # WhatsApp & SMS provider abstractions
│       │   │   ├── provider/                # Twilio, Meta WhatsApp Cloud API, REST, Logging
│       │   ├── repository/                  # Spring Data JPA Repositories
│       │   ├── security/                    # JWT Stateless Filter, CustomUserDetailsService
│       │   ├── service/                     # Business Logic (@Transactional boundaries)
│       │   └── storage/                     # Local filesystem & Cloud image storage
│       └── test/                            # 21 Integration, Repository & Service tests
├── frontend/                                 # React 19 + Vite 8 + Tailwind CSS v4
│   ├── Dockerfile                           # Multi-stage Node 20 + Nginx 1.27
│   ├── nginx.conf                           # SPA routing & /api reverse proxy
│   ├── package.json                         # React 19, Lucide, Axios, Tailwind v4
│   ├── vite.config.js                       # Vite config with /api proxy to 8080
│   └── src/
│       ├── components/                      # Sidebar, Navbar, TaxInvoiceModal, StockProgressBar
│       ├── context/                         # AuthContext (JWT bearer persistence & roles)
│       ├── pages/                           # Dashboard, Products, Sales, Pending, Customers, etc.
│       └── services/api.js                  # Axios interceptors with typed API methods
├── docker-compose.yml                       # Multi-container orchestration (MySQL + Backend + Frontend)
├── .env.example                             # Complete production environment reference
└── README.md
```

---

## Key Features & Business Invariants

### 1. Two-Phase SELL Execution Lifecycle
* **Step 1: Create Pending Sale (`POST /api/admin/sales`)**  
  Records intent, items, and quantities as `PENDING`. **Stock is NOT deducted** at this point. Customer notifications are not dispatched.
* **Step 2: Confirm Sale (`POST /api/admin/sales/{id}/sell`)**  
  Atomically checks stock inside `@Transactional(isolation = REPEATABLE_READ)`. If sufficient:
  * Deducts stock quantities from inventory.
  * Transitions status to `CONFIRMED`.
  * Asynchronously dispatches WhatsApp & SMS purchase confirmations.
  * Checks low-stock alert limits.

### 2. Duplicate Alert Suppression
* A product alerts the administrator when `availableQuantity <= lowStockLimit` (`lowStockAlertSent = true`).
* When replenished above the limit, `lowStockAlertSent` is automatically re-armed (`false`), preventing alert storms.

### 3. Manual Payment Reconciliations
* Admin verifies cash, UPI UTR, or card payments via `POST /api/admin/sales/{id}/confirm-payment`.
* Transitions payment status from `PENDING` to `SUCCESS` and triggers official payment confirmation notifications.

### 4. Official GST Tax Invoice & PDF Generation
* Formatted tax bill generated on the fly with customer details, itemized breakdown, and GST figures.
* Downloadable PDF generated with OpenPDF (`/api/admin/sales/{id}/bill/pdf`).

---

## Live Notification Providers

The notification architecture supports official production messaging APIs:

```text
               NotificationService
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
WhatsAppNotificationService   SmsNotificationService
       │                               │
       └───────────────┬───────────────┘
                       │
             NotificationProvider
                       ├── TwilioNotificationProvider (Messages API: WhatsApp & SMS)
                       ├── MetaWhatsAppNotificationProvider (Graph API v20.0)
                       ├── RestNotificationProvider (Generic Webhook)
                       └── LoggingNotificationProvider (Local Dev Fallback)
```

### Supported Providers:
1. **Twilio Messages API:**
   * **SMS:** Sends via Twilio Messaging REST API with Basic Auth.
   * **WhatsApp:** Sends via Twilio WhatsApp Sandbox (`whatsapp:+14155238886`) or registered sender.
2. **Meta WhatsApp Cloud API (v20.0):**
   * Uses official Facebook Graph API (`https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages`) with Bearer token authentication.
3. **Audit Trail:**
   * Every message attempt is logged to the `notification_logs` table with recipient, channel, alert type, provider message ID, status (`SENT`, `FAILED`), and diagnostic error messages.

> [!NOTE]
> If live credentials are not supplied in the environment, the provider logs an informative warning:
> `LIVE NOTIFICATIONS = BLOCKED BY CREDENTIALS (Configure TWILIO_ACCOUNT_SID or WHATSAPP_API_KEY)` and records the event in the audit trail without disrupting core checkout transactions.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Language** | Java (OpenJDK) | 21 LTS | Core backend platform |
| **Framework** | Spring Boot | 3.3.4 | Microservice framework |
| **Security** | Spring Security | 6.x | Stateless JWT authentication & RBAC |
| **ORM / Data** | Spring Data JPA / Hibernate | 6.5.x | Relational persistence & transactions |
| **Database** | MySQL | 8.4 LTS | Production relational database |
| **PDF Engine** | OpenPDF | 2.0.3 | High-fidelity invoice PDF generation |
| **Frontend** | React | 19.x | Modern reactive user interface |
| **Bundler** | Vite | 8.x | Lightning-fast development & production bundling |
| **Styling** | Tailwind CSS | v4 | Modern SaaS design system |
| **Icons** | Lucide React | Latest | Consistent visual iconography |
| **HTTP Client** | Axios | 1.7.x | REST API client with JWT interceptors |
| **Containers** | Docker & Compose | Compose 3.8 | Multi-container production deployment |

---

## User Roles & Security

| Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| `ROLE_ADMIN` | `admin` | `Admin@123` | Full warehouse CRUD, 2-phase SELL, payment confirmations, stock thresholds, notification audits, system settings |
| `ROLE_CUSTOMER`| `customer` | `Customer@123` | Public catalog browsing, product specifications, stock availability |

---

## API Specification & Swagger

Interactive Swagger UI documentation is available when running the backend:
* **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* **OpenAPI JSON:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Key Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token |
| `GET` | `/api/products` | Public | Paginated product search & catalog |
| `POST` | `/api/admin/products` | ADMIN | Add new hardware item |
| `POST` | `/api/admin/products/{id}/stock` | ADMIN | Update stock quantity & replenish |
| `POST` | `/api/admin/upload/image` | ADMIN | Upload product image |
| `POST` | `/api/admin/sales` | ADMIN | Create PENDING sale (stock untouched) |
| `POST` | `/api/admin/sales/{id}/sell` | ADMIN | Confirm sale, deduct stock & dispatch alerts |
| `POST` | `/api/admin/sales/{id}/confirm-payment` | ADMIN | Mark payment SUCCESS & send receipt |
| `GET` | `/api/admin/sales/{id}/bill/pdf` | ADMIN | Download printable GST invoice PDF |
| `GET` | `/api/admin/dashboard` | ADMIN | SaaS summary metrics & low stock alerts |
| `GET` | `/api/admin/notifications/logs` | ADMIN | Audit trail of WhatsApp & SMS dispatches |

---

## Getting Started (Local Development)

### Prerequisites
* Java 21 JDK
* Maven 3.9+
* Node.js 20+ & npm 10+
* MySQL 8.4 running locally on port 3306

### 1. Start Spring Boot Backend
```powershell
cd backend
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080`.*

### 2. Start React Frontend
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` with automatic API proxying to `http://localhost:8080`.*

---

## Running Automated Tests

Run the full backend test suite covering security, repository queries, transactional sale deduplication, stock replenishment alerts, and E2E checkout flows:

```powershell
cd backend
mvn test
```

**Result:**
```text
[INFO] Results:
[INFO] Tests run: 21, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## Docker Container Orchestration

Run the entire system (MySQL 8.4 + Backend + Nginx Frontend) with a single command:

```bash
docker compose up -d --build
```

### Services Started:
* `hardwareshop-mysql`: MySQL 8.4 on internal network and port `3307`
* `hardwareshop-backend`: Spring Boot 3.3.4 on port `8080`
* `hardwareshop-frontend`: React 19 + Nginx on port `80`

### Access Points:
* **Web Application:** [http://localhost](http://localhost)
* **REST API:** [http://localhost:8080/api](http://localhost:8080/api)
* **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Spring Boot HTTP port |
| `DB_URL` | `jdbc:mysql://...` | JDBC connection string |
| `DB_USERNAME` | `root` | MySQL database user |
| `DB_PASSWORD` | `rd@2` | MySQL password |
| `JWT_SECRET` | `dGhpc0lz...` | 256-bit Base64 signing secret |
| `JWT_EXPIRATION_MS` | `86400000` | Token expiration time (24 hours) |
| `NOTIFICATION_PROVIDER` | `twilio` | Provider: `twilio`, `meta`, `rest`, `mock` |
| `TWILIO_ACCOUNT_SID` | *Optional* | Twilio Account SID (`AC...`) |
| `TWILIO_AUTH_TOKEN` | *Optional* | Twilio Auth Token |
| `TWILIO_FROM_PHONE` | *Optional* | Twilio SMS sender number |
| `TWILIO_WHATSAPP_FROM`| *Optional* | Twilio WhatsApp sender number |
| `WHATSAPP_API_KEY` | *Optional* | Meta WhatsApp Cloud API Bearer Token |
| `WHATSAPP_PHONE_NUMBER_ID` | *Optional* | Meta WhatsApp Phone Number ID |
| `ADMIN_ALERT_PHONE` | `+919876543210` | Phone number receiving warehouse low-stock alerts |

---

## Cloud Deployment Guide

### Deploying to Render / Railway / AWS / GCP
1. **Database:** Provision a managed MySQL 8.4 database (e.g. AWS RDS, Railway MySQL, or PlanetScale).
2. **Backend:** Deploy `backend/Dockerfile` as a Web Service. Set environment variables from `.env.example`.
3. **Frontend:** Deploy `frontend/Dockerfile` as a Web Service or deploy `frontend/dist` to Cloudflare Pages / Vercel / Netlify with `VITE_API_BASE_URL` pointing to the backend.
4. **Notifications:** Enter your verified Twilio or Meta WhatsApp Cloud API credentials in the production environment variables to activate live notifications.

---

## Authors & Maintenance

* **Author:** Rishi Dubey ([rd1699906@gmail.com](mailto:rd1699906@gmail.com))
* **Repository:** [https://github.com/rishi-dubey06/hardware-shop-management-system](https://github.com/rishi-dubey06/hardware-shop-management-system)

# Hardware Shop Inventory, Sales, Billing and Customer Management System

[![Java](https://img.shields.io/badge/Java-21_LTS-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.4-blue.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Build & Test](https://img.shields.io/badge/Tests-21_Passed-success.svg)]()

A complete, production-grade **Hardware Shop Inventory, Sales, Billing, and Customer Management System** built with **Java 21**, **Spring Boot 3.3.4**, **Spring Security (stateless JWT)**, **Spring Data JPA/Hibernate**, and **MySQL 8.4**.

Features a responsive Single-Page Web Interface, transactional multi-item order processing with atomic **SELL** inventory deduction, duplicate-protected low-stock alerts, manual payment confirmations, structured and downloadable PDF invoices, and a provider-agnostic notification engine for WhatsApp and SMS.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Key Features & Business Rules](#key-features--business-rules)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [User Roles & Security](#user-roles--security)
6. [API Specification & Documentation](#api-specification--documentation)
7. [Environment Variables](#environment-variables)
8. [Getting Started Locally](#getting-started-locally)
9. [Running Automated Tests](#running-automated-tests)
10. [Docker & Containerized Deployment](#docker--containerized-deployment)
11. [Cloud Deployment Guide](#cloud-deployment-guide)
12. [Sample API Payloads](#sample-api-payloads)

---

## System Architecture

The application adopts an enterprise layered architecture ensuring loose coupling, separation of concerns, and full transaction isolation:

```text
┌────────────────────────────────────────────────────────┐
│                   Web Client / SPA                     │
│        (HTML5, Tailwind CSS, Vanilla JS, Lucide)        │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (JWT Bearer)
┌───────────────────────────▼────────────────────────────┐
│                   Controller Layer                     │
│  AuthController, ProductController, AdminControllers   │
└───────────────────────────┬────────────────────────────┘
                            │ DTOs & Jakarta Validation
┌───────────────────────────▼────────────────────────────┐
│                    Service Layer                       │
│  SaleService, ProductService, PaymentService, etc.    │
│  (@Transactional boundaries, Domain logic)             │
└───────────┬───────────────────────────────┬────────────┘
            │                               │
┌───────────▼───────────┐       ┌───────────▼───────────┐
│   Repository Layer    │       │ Notification / Storage │
│ (Spring Data JPA)     │       │ WhatsApp, SMS, OpenPDF│
└───────────┬───────────┘       └───────────────────────┘
            │
┌───────────▼───────────┐
│     MySQL 8.4 RDBMS   │
└───────────────────────┘
```

---

## Key Features & Business Rules

### 1. Two-Phase Sale Execution (`PENDING` -> `CONFIRMED`)
* **Create Pending Sale**: Customer details and chosen items are saved. Total bill is prepared. Stock is **NOT** deducted. Final notifications are **NOT** dispatched.
* **The SELL Button (`POST /api/admin/sales/{id}/sell`)**:
  * Atomically validates stock across all order items inside a database transaction (`@Transactional`).
  * If any item is out of stock, the entire sale confirmation fails cleanly (`InsufficientStockException`) without partial updates.
  * Stock is safely deducted.
  * Sale transitions to `CONFIRMED`.
  * Customer purchase notification (WhatsApp/SMS) is triggered with item names and totals.
  * Low-stock conditions are evaluated for modified products.

### 2. Low-Stock Alert System with Duplicate-Alert Suppression
* Every product has a customizable `lowStockLimit` and `lowStockNotificationEnabled` toggle.
* When stock drops to or below the limit (`availableQuantity <= lowStockLimit`), an alert is dispatched to the Store Administrator.
* **Duplicate-Alert Protection**: A product sends an alert only once upon crossing the threshold (`lowStockAlertSent = true`). Subsequent sales do not spam the administrator.
* **Re-arming Mechanism**: When new inventory is added and quantity rises above `lowStockLimit`, `lowStockAlertSent` is automatically reset to `false`.

### 3. Manual Payment Confirmation (`PENDING` -> `SUCCESS`)
* Designed for retail counter workflows supporting **CASH**, **UPI**, and other manual payment channels.
* Clicking **SELL** does **not** automatically mark payment as complete.
* Admin uses **CONFIRM PAYMENT** (`POST /api/admin/sales/{id}/confirm-payment`) after checking cash or UPI transfer.
* Triggers a customer payment receipt notification including purchased item names, amount paid, and status.

### 4. Billing & Printable Invoices
* Generates structured receipts and monospace text receipts matching store counter formats.
* Integrated **OpenPDF** engine generates downloadable tax invoice PDFs at `GET /api/admin/sales/{id}/bill/pdf`.

### 5. Multi-Provider Notification Abstraction
* Provider-based architecture:
  * `LoggingNotificationProvider` (Default / simulated provider with formatted log output).
  * `RestNotificationProvider` (Webhook / HTTP REST provider for Meta WhatsApp Cloud API, Twilio, or Fast2SMS).
  * In-database `NotificationLog` audit trail accessible via the Admin Dashboard.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Language & Platform** | Java 21 LTS |
| **Framework** | Spring Boot 3.3.4 (Web, Security, Data JPA, Validation, Actuator) |
| **Database** | MySQL 8.4 / Hibernate 6 |
| **Testing** | JUnit 5, Mockito, AssertJ, Spring Security Test, H2 In-Memory DB |
| **Security** | Spring Security 6, JJWT 0.12.6 (HMAC-SHA256 stateless tokens), BCrypt |
| **PDF Generation** | OpenPDF 2.0.3 |
| **API Documentation** | Springdoc OpenAPI 2.6.0 (Swagger UI 3.0) |
| **Frontend** | Responsive HTML5, Tailwind CSS, Vanilla JS, Lucide Icons |
| **Containerization** | Docker, Docker Compose (Multi-stage build, Temurin 21 JRE) |

---

## Database Design

The schema is normalized, indexed, and audited with timestamps:

* **`users`**: Store administrator and customer accounts (`id`, `username`, `password`, `email`, `full_name`, `role`).
* **`customers`**: Customer CRM directory (`id`, `name`, `phone_number`, `address`, `email`).
* **`products`**: Inventory records (`id`, `name`, `description`, `category`, `price`, `available_quantity`, `image_url`, `out_of_stock`, `expected_restock_date`, `low_stock_limit`, `low_stock_notification_enabled`, `low_stock_alert_sent`).
* **`sales`**: Sales header (`id`, `bill_number`, `customer_id`, `sale_date`, `sale_time`, `total_amount`, `sale_status`, `payment_status`, `payment_method`, `notes`).
* **`sale_items`**: Order line items (`id`, `sale_id`, `product_id`, `quantity`, `unit_price`, `subtotal`). *Note: unit price is frozen as a historical snapshot upon creation.*
* **`payments`**: Payment ledger records (`id`, `sale_id`, `amount`, `payment_method`, `payment_status`, `transaction_reference`, `payment_date`).
* **`notification_logs`**: Audit trail of WhatsApp and SMS messages (`id`, `recipient`, `channel`, `notification_type`, `message`, `status`, `provider_response`, `created_at`).

---

## User Roles & Security

| Role | Permissions |
| :--- | :--- |
| **`ROLE_ADMIN`** | Full access: Add/edit/delete products, image uploads, stock adjustments, low-stock threshold configuration, create sales, confirm **SELL**, confirm payments, download bills, view dashboard, view notification logs. |
| **`ROLE_CUSTOMER`** | Restricted access: Browse products, search, check stock availability, view prices and restocking dates. Cannot access `/api/admin/**`. |
| **Public / Anonymous** | Browse products (`GET /api/products/**`), view stored product images (`GET /api/uploads/**`), login, Swagger UI. |

### Pre-Seeded Default Accounts

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | Full administrative control |
| **Customer** | `customer` | `Customer@123` | Read-only retail browsing |

---

## API Specification & Documentation

When the application is running, open **Swagger UI**:
* [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
* Raw OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### Primary REST Endpoints

#### Authentication
* `POST /api/auth/login` — Authenticate and receive JWT Bearer token
* `POST /api/auth/register` — Register a customer account
* `GET  /api/auth/me` — Current user profile

#### Product Catalog (Public)
* `GET  /api/products` — Search and filter products (`query`, `category`, `page`, `size`)
* `GET  /api/products/{id}` — Get single product
* `GET  /api/products/categories` — Get distinct categories

#### Admin Product & Stock Management
* `POST /api/admin/products` — Create product
* `PUT  /api/admin/products/{id}` — Update product details
* `DELETE /api/admin/products/{id}` — Delete product
* `POST /api/admin/products/{id}/stock` — Adjust quantity (`quantityChange: +/- N`)
* `PUT  /api/admin/products/{id}/low-stock-settings` — Set threshold and notification toggle
* `GET  /api/admin/products/low-stock` — List items below threshold

#### Admin Sales & Billing
* `POST /api/admin/sales` — Create **PENDING** sale (Stock remains untouched)
* `GET  /api/admin/sales` — Filter sales by status (`saleStatus`, `paymentStatus`)
* `GET  /api/admin/sales/pending` — List pending sales
* `GET  /api/admin/sales/{id}` — Sale details
* `POST /api/admin/sales/{id}/sell` — **SELL Action** (Deducts stock, marks CONFIRMED, sends notification)
* `POST /api/admin/sales/{id}/confirm-payment` — Confirm manual payment (Marks SUCCESS, sends receipt notification)
* `GET  /api/admin/sales/{id}/bill` — Formatted bill response
* `GET  /api/admin/sales/{id}/bill/pdf` — Download printable PDF invoice

#### Admin Customers & Dashboard
* `GET  /api/admin/customers` — Search customer CRM directory
* `POST /api/admin/customers` — Create customer
* `GET  /api/admin/customers/{id}/sales` — Customer purchase history
* `GET  /api/admin/dashboard` — Complete dashboard metrics
* `GET  /api/admin/notifications/logs` — Real-time notification dispatch audit

---

## Environment Variables

Copy `.env.example` to configure your environment:

```bash
# Server & Port
PORT=8080

# MySQL Database
DB_URL=jdbc:mysql://localhost:3306/hardwareshop_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
DB_USERNAME=root
DB_PASSWORD=your_password

# Security & JWT
JWT_SECRET=dGhpc0lzQVZlcnlTZWN1cmVTZWNyZXRLZXlGb3JTYWxlc0hhcmR3YXJlU2hvcEFwcGxpY2F0aW9uMjAyNg==
JWT_EXPIRATION_MS=86400000

# Notifications (mock or rest)
NOTIFICATION_PROVIDER=mock
ADMIN_ALERT_PHONE=+919876543210
WHATSAPP_API_URL=
WHATSAPP_API_KEY=
SMS_API_URL=
SMS_API_KEY=

# Shop Branding
SHOP_NAME=XYZ HARDWARE SHOP
SHOP_CONTACT=+91 98765 43210
SHOP_ADDRESS=Shop #12, Central Hardware Market, Sector 18, Greater Noida, UP
```

---

## Getting Started Locally

### Prerequisites
* **Java 21** or later
* **Maven 3.9+**
* **MySQL 8.0+**

### Step 1: Create Database
```sql
CREATE DATABASE IF NOT EXISTS hardwareshop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Build the Application
```bash
mvn clean package
```

### Step 3: Run the Application
```bash
java -jar target/hardware-shop-management-system-1.0.0.jar
```

### Step 4: Open Browser
Navigate to [http://localhost:8080](http://localhost:8080) to use the UI.

---

## Running Automated Tests

Run the full automated test suite (21 unit, repository, and end-to-end integration tests):

```bash
mvn test
```

The test suite automatically tests:
1. Complete lifecycle: Product Stock = 50 -> Purchase 5 -> Pending Sale -> Stock remains 50 -> SELL -> Stock = 45 -> Confirmation notification -> Confirm Payment -> SUCCESS.
2. Insufficient stock transaction rollback.
3. Duplicate SELL rejection.
4. Low-stock alert generation when threshold reached with notifications enabled.
5. Notification suppression when disabled.
6. Role authorization enforcement (Customer denied from Admin endpoints).

---

## Docker & Containerized Deployment

Run the complete stack (Spring Boot + MySQL 8.4) with a single command:

```bash
docker-compose up --build -d
```

Check logs:
```bash
docker-compose logs -f app
```

Stop stack:
```bash
docker-compose down
```

---

## Cloud Deployment Guide

### Deploying to Render
1. Push this repository to GitHub.
2. In Render, select **New Blueprint Instance** and select your repository.
3. Render automatically provisions the `render.yaml` configuration with MySQL and the containerized Spring Boot web service.

### Deploying to Railway / Fly.io / AWS
1. Set the environment variables listed in `.env.example`.
2. Connect your MySQL instance string to `DB_URL`.
3. The Dockerfile builds a self-contained container with a non-root user and container-aware JVM settings.

---

## Sample API Payloads

### 1. Create Pending Sale (`POST /api/admin/sales`)
```json
{
  "customerName": "Rahul Sharma",
  "customerPhone": "9876543210",
  "customerAddress": "Greater Noida, Uttar Pradesh",
  "paymentMethod": "UPI",
  "items": [
    {
      "productId": 1,
      "quantity": 5
    },
    {
      "productId": 2,
      "quantity": 2
    }
  ]
}
```

### 2. Confirm SELL (`POST /api/admin/sales/1/sell`)
*Response:*
```json
{
  "success": true,
  "message": "Sale confirmed successfully! Inventory deducted and customer notification sent.",
  "data": {
    "id": 1,
    "billNumber": "INV-2026-1001",
    "saleStatus": "CONFIRMED",
    "paymentStatus": "PENDING",
    "totalAmount": 1550.00
  }
}
```

### 3. Confirm Payment (`POST /api/admin/sales/1/confirm-payment`)
```json
{
  "paymentMethod": "UPI",
  "transactionReference": "UPI/2026/0987123"
}
```

---

## Authors & Maintenance

* **Developer:** Rishi Dubey (<rd1699906@gmail.com>)
* **Repository:** [https://github.com/rishi-dubey06/hardware-shop-management-system](https://github.com/rishi-dubey06/hardware-shop-management-system)

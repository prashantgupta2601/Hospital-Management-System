# PG Care — Hospital Management System (HMS)

> A modern, full-stack, enterprise-grade Hospital Management System featuring patient records, doctor scheduling, appointment management, billing with dynamic PDF generation, live WebSocket notifications, and role-based access control.

---

## 📑 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
  - [Production Mode (Docker Compose)](#production-mode-docker-compose)
  - [Development Mode (Local / Standalone)](#development-mode-local--standalone)
- [API Endpoints](#api-endpoints)
- [Screenshots & Demo](#screenshots--demo)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

**PG Care HMS** is a healthcare management platform engineered for clinics and hospitals. The system provides a unified interface for hospital administrators, doctors, and patients. It streamlines clinical workflows—from patient registration and appointment booking to clinical shift tracking, electronic medical records (EMR), automated PDF receipt generation, and real-time appointment updates via WebSockets.

---

## Features

All features listed below are verified against the codebase implementation:

- **Authentication & Role-Based Access Control (RBAC)**
  - Stateless authentication using JSON Web Tokens (JWT).
  - Secure password hashing with BCrypt.
  - Three user roles: `ADMIN`, `DOCTOR`, and `PATIENT` with granular endpoint protection.
- **Patient Management**
  - Full CRUD operations for patient demographics (name, email, phone, address, date of birth, gender).
- **Doctor & Specialty Directory**
  - Profiles including specialization, years of experience, contact details, and availability schedules.
- **Appointment Scheduling & Lifecycle**
  - Booking system linking patients to specific doctors.
  - Status lifecycle management (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
  - Automatic WebSocket broadcast triggers upon status changes.
- **Doctor Shift Scheduling**
  - Roster management tracking day of the week, shift start/end times, department, and status.
  - Query filters by doctor ID or clinical department.
- **Electronic Medical Records (EMR)**
  - Clinical documentation: visit date, diagnosis, treatment notes, and medication prescriptions.
  - Lab report attachment support (Base64 PDF and images) with in-browser preview or download.
  - Chronological patient timeline view.
- **Billing & PDF Invoicing**
  - Invoice generation linked to appointments and patients.
  - Payment status tracking (`PENDING`, `PAID`, `FAILED`).
  - Server-side dynamic PDF receipt generation streamed via OpenPDF (`GET /api/billings/{id}/receipt`).
- **Real-Time Communication (WebSocket / STOMP)**
  - STOMP protocol over SockJS fallback at `/ws`.
  - Pub/Sub topics: `/topic/notifications` and `/topic/appointments`.
  - In-app toast alerts triggered across active browser sessions on appointment events.
  - Ping-pong keep-alive endpoint (`/app/ping`).
- **Analytics & Reporting**
  - Key performance indicators: appointments per day, doctor workload distribution, patient growth trends, and overall hospital statistics.
  - Visualized on the frontend with Chart.js.
- **Frontend State & Resilience**
  - Centralized in-memory cache (`AppState`) with request deduplication and a 30-second TTL.
  - Offline mode detection and automatic request interceptors.
  - Server-down recovery screen (`ServerUnavailableScreen`) with automatic retry capability.
  - Dark / Light theme toggle with persistence in `localStorage`.
  - Floating AI assistant widget on the UI *(Note: Frontend interface implemented; AI backend recommendation model is planned under future improvements)*.
- **Production Hardening**
  - Multi-stage Docker builds separating JDK builder and minimal JRE runtime.
  - Non-root user execution (`hms`) inside backend containers.
  - Nginx reverse proxy handling static file caching, gzip compression, security headers, and API/WebSocket routing.
  - Spring Boot Actuator health checks and liveness/readiness probes.

---

## Tech Stack

### Frontend
- **Structure & Logic:** HTML5, Vanilla JavaScript (ES6+)
- **Styling:** CSS3, Custom Luxury Themes, Bootstrap 5.3.0
- **Icons & Typography:** FontAwesome 6.4.0, Bootstrap Icons, Google Fonts (Inter, Cinzel, Playfair Display)
- **HTTP Client:** Axios (configured with JWT & offline interceptors)
- **Data Visualization:** Chart.js
- **Real-Time Messaging:** SockJS-client (1.6.1) & STOMP.js (2.3.3)
- **Animations:** GSAP 3.12.2, AOS 2.3.1, Three.js (r128)

### Backend
- **Framework:** Spring Boot 3.3.0
- **Language:** Java 17
- **Security:** Spring Security 6 (Stateless JWT, BCrypt)
- **Data Persistence:** Spring Data JPA / Hibernate
- **Real-Time Messaging:** Spring WebSocket (STOMP Broker)
- **PDF Engine:** LibrePDF OpenPDF (1.3.30)
- **Monitoring:** Spring Boot Starter Actuator
- **Utilities:** Project Lombok, Jakarta Validation

### Database
- **Production:** PostgreSQL 16 (Alpine containerized)
- **Development Profile:** H2 In-Memory Database (`jdbc:h2:mem:hmsdb`)

### DevOps & Tools
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy / Web Server:** Nginx 1.27 Alpine
- **Build System:** Apache Maven 3.x

---

## Architecture & Folder Structure

### Network Architecture
```text
                  ┌──────────────────────────────────────────────┐
                  │                 CLIENT BROWSER               │
                  └───────────────────────┬──────────────────────┘
                                          │ HTTP (Port 80)
                                          ▼
                      ┌──────────────────────────────────────┐
                      │            frontend (Nginx)          │
                      │       Reverse Proxy & Static Files   │
                      └───────┬──────────────────────┬───────┘
            Static Assets     │                      │ Proxies /api/*
            (HTML/CSS/JS)     │                      │ Proxies /ws/*
                              ▼                      ▼
                     ┌────────────────┐   ┌──────────────────────┐
                     │ Static Web UI  │   │  backend (Spring)    │
                     └────────────────┘   │  Port 8081 (Internal)│
                                          └──────────┬───────────┘
                                                     │ JPA / JDBC
                                                     ▼
                                          ┌──────────────────────┐
                                          │  postgres (DB)       │
                                          │  Port 5432 (Internal)│
                                          └──────────────────────┘
```

### Folder Structure
```text
HMS Bootstrap/
├── .env.example                  # Environment configuration template
├── docker-compose.yml            # Multi-container orchestration (postgres, backend, frontend)
├── backend/
│   ├── Dockerfile                # Multi-stage build (Temurin JDK 17 -> JRE 17)
│   ├── pom.xml                   # Maven dependencies and build configuration
│   └── src/
│       └── main/
│           ├── java/com/hms/
│           │   ├── BackendApplication.java
│           │   ├── config/       # WebSocket configuration (STOMP)
│           │   ├── common/       # Global exception handlers and response wrappers
│           │   ├── security/     # Spring Security, JWT filters, and UserDetails
│           │   └── modules/      # Domain-driven feature modules
│           │       ├── analytics/     # Analytics controllers, services, DTOs
│           │       ├── appointment/   # Appointment CRUD, scheduling, lifecycle
│           │       ├── auth/          # User registration, login, JWT issuance
│           │       ├── billing/       # Billing invoices and PDF generation
│           │       ├── doctor/        # Doctor profile and directory management
│           │       ├── notification/  # WebSocket STOMP messaging and DTOs
│           │       ├── patient/       # Patient records and demographics
│           │       ├── record/        # Medical records, diagnosis, lab attachments
│           │       └── shift/         # Doctor duty shifts and scheduling
│           └── resources/
│               └── application.yml   # Spring Boot configuration (dev and prod profiles)
├── frontend/
│   ├── Dockerfile                # Nginx Alpine container serving static files
│   ├── nginx.conf                # Nginx reverse proxy, gzip, and security headers
│   ├── index.html                # Main admin dashboard
│   ├── login.html                # Authentication portal (Sign In / Register)
│   ├── appointments.html         # Appointment scheduling interface
│   ├── doctors.html              # Doctor directory interface
│   ├── patients.html             # Patient management interface
│   ├── records.html              # Medical records and timeline interface
│   ├── shifts.html               # Doctor shift management interface
│   ├── pg-care-landing.html      # Public showcase landing page
│   ├── pages/
│   │   └── analytics.html        # Analytics charts and statistics
│   ├── css/                      # Stylesheets (luxury landing, login, polish, base)
│   ├── js/                       # Core frontend logic (main.js, state.js, ux.js, chatbot.js)
│   └── services/                 # API client (api.js) and WebSocket client (websocket.js)
└── maven/                        # Bundled Apache Maven binary distribution
```

---

## Prerequisites

### For Docker Deployment (Recommended)
- **Docker Engine:** v24.0 or higher
- **Docker Compose:** v2.20 or higher
- System port `80` must be available (and optionally `5432` if binding Postgres to host).

### For Local Standalone Development (Without Docker)
- **Java Development Kit (JDK):** Version 17
- **Apache Maven:** Version 3.8+ (or use `./maven/bin/mvn`)
- **Modern Web Browser:** Chrome, Firefox, Safari, or Edge
- (Optional) **PostgreSQL:** Version 16 (if testing `prod` profile locally; otherwise H2 in-memory DB is used by default).

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/prashantgupta2601/Hospital-Management-System.git
cd Hospital-Management-System
```

### 2. Configure Environment Variables
Copy the template configuration file:
```bash
# Linux / macOS / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Open `.env` in your editor and update default values with your secure secrets (especially `POSTGRES_PASSWORD` and `JWT_SECRET`).

---

## Environment Variables

The table below lists all environment variables consumed across Docker Compose, PostgreSQL, and Spring Boot:

| Variable Name | Required | Default in Code / Example | Description |
|---|:---:|---|---|
| `POSTGRES_DB` | Yes | `hms` | Name of the PostgreSQL database created on container startup. |
| `POSTGRES_USER` | Yes | `postgres` | Superuser username for PostgreSQL. |
| `POSTGRES_PASSWORD` | Yes | `changeme_strong_password` | Superuser password for PostgreSQL. |
| `SPRING_DATASOURCE_URL` | Yes (Prod) | `jdbc:postgresql://postgres:5432/hms` | JDBC connection URL for Spring Boot backend. |
| `SPRING_DATASOURCE_USERNAME` | Yes (Prod) | `postgres` | Username used by Spring Data JPA to connect to the DB. |
| `SPRING_DATASOURCE_PASSWORD` | Yes (Prod) | `changeme_strong_password` | Password used by Spring Data JPA to connect to the DB. |
| `JWT_SECRET` | Yes (Prod) | `replace_with_64_hex_char_random_secret_key` | 256-bit secret key used to sign and verify JWT authentication tokens. |
| `JWT_EXPIRATION_MS` | No | `86400000` | Expiration time for JWT tokens in milliseconds (86400000 = 24 hours). |
| `SERVER_PORT` | No | `8081` | Port on which the Spring Boot application runs inside its container. |
| `SPRING_PROFILES_ACTIVE` | No | `prod` (Docker) / `dev` (Local default) | Active Spring profile (`dev` uses H2 in-memory DB; `prod` uses PostgreSQL). |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost,http://localhost:80` | Allowed origins for Cross-Origin Resource Sharing. |

> [!WARNING]
> Never commit your `.env` file containing production credentials or real JWT secrets to version control.

---

## Running the Project

### Production Mode (Docker Compose)

This is the standard and recommended way to run the entire triple-service stack (Nginx, Spring Boot, PostgreSQL):

1. **Build and launch services:**
   ```bash
   docker compose up --build -d
   ```

2. **Verify container status:**
   ```bash
   docker compose ps
   ```

3. **View live logs:**
   ```bash
   # All services
   docker compose logs -f

   # Specific service
   docker compose logs -f backend
   docker compose logs -f frontend
   docker compose logs -f postgres
   ```

4. **Access the application:**
   - **Web Application:** `http://localhost`
   - **Nginx Health Check:** `http://localhost/health`
   - **Backend Actuator Health:** `http://localhost/actuator/health`

5. **Stop services:**
   ```bash
   # Stop containers without removing persistent data
   docker compose down

   # Stop and purge PostgreSQL database volume (destructive)
   docker compose down -v
   ```

---

### Development Mode (Local / Standalone)

To run the project locally without Docker:

#### 1. Start the Backend (Spring Boot with H2 Database)
The `dev` profile activates automatically when running locally, utilizing the embedded in-memory H2 database (no PostgreSQL setup required):

```bash
cd backend
mvn clean spring-boot:run
```
*(On Windows using bundled Maven: `..\maven\bin\mvn.cmd clean spring-boot:run`)*

- The backend will start at: `http://localhost:8081`
- H2 Database Console: `http://localhost:8081/h2-console`
  - **JDBC URL:** `jdbc:h2:mem:hmsdb`
  - **User:** `sa`
  - **Password:** `password`

#### 2. Run the Frontend
Since the frontend consists of static HTML, CSS, and JavaScript files, it can be served using any local HTTP static server:

```bash
# Option A: Python
python -m http.server 8000 -d frontend

# Option B: Node.js http-server / serve
npx serve frontend -p 8000

# Option C: VS Code Live Server extension
# Right-click frontend/index.html -> "Open with Live Server"
```

Open `http://localhost:8000/login.html` in your browser.

---

## API Endpoints

The table below outlines the primary REST and WebSocket endpoints implemented in the Spring Boot backend:

| Module | Method | Endpoint | Description | Access Control |
|---|:---:|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register new user account | Public |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |
| **Patients** | `POST` | `/api/patients` | Create a new patient record | `ADMIN`, `DOCTOR` |
| **Patients** | `GET` | `/api/patients` | Retrieve list of all patients | `ADMIN`, `DOCTOR` |
| **Patients** | `GET` | `/api/patients/{id}` | Get patient details by ID | `ADMIN`, `DOCTOR` |
| **Patients** | `PUT` | `/api/patients/{id}` | Update patient details | `ADMIN`, `DOCTOR` |
| **Patients** | `DELETE` | `/api/patients/{id}` | Delete a patient record | `ADMIN`, `DOCTOR` |
| **Doctors** | `POST` | `/api/doctors` | Create a new doctor profile | `ADMIN`, `DOCTOR` |
| **Doctors** | `GET` | `/api/doctors` | Retrieve list of all doctors | `ADMIN`, `DOCTOR` |
| **Doctors** | `GET` | `/api/doctors/{id}` | Get doctor profile by ID | `ADMIN`, `DOCTOR` |
| **Doctors** | `PUT` | `/api/doctors/{id}` | Update doctor information | `ADMIN`, `DOCTOR` |
| **Doctors** | `DELETE` | `/api/doctors/{id}` | Delete a doctor profile | `ADMIN`, `DOCTOR` |
| **Appointments** | `POST` | `/api/appointments` | Book a new appointment | `ADMIN`, `DOCTOR` |
| **Appointments** | `GET` | `/api/appointments` | List all appointments | `ADMIN`, `DOCTOR` |
| **Appointments** | `GET` | `/api/appointments/{id}` | Get appointment by ID | `ADMIN`, `DOCTOR` |
| **Appointments** | `GET` | `/api/appointments/patient/{patientId}` | Get appointments for a patient | `ADMIN`, `DOCTOR` |
| **Appointments** | `GET` | `/api/appointments/doctor/{doctorId}` | Get appointments for a doctor | `ADMIN`, `DOCTOR` |
| **Appointments** | `PATCH` | `/api/appointments/{id}/status?status={status}` | Update status (`SCHEDULED`, `COMPLETED`, `CANCELLED`) | `ADMIN`, `DOCTOR` |
| **Appointments** | `DELETE` | `/api/appointments/{id}` | Delete an appointment | `ADMIN`, `DOCTOR` |
| **Doctor Shifts** | `POST` | `/api/shifts` | Assign a new doctor shift | `ADMIN`, `DOCTOR` |
| **Doctor Shifts** | `GET` | `/api/shifts` | List all scheduled shifts | `ADMIN`, `DOCTOR` |
| **Doctor Shifts** | `GET` | `/api/shifts/doctor/{doctorId}` | Get shifts for a specific doctor | `ADMIN`, `DOCTOR` |
| **Doctor Shifts** | `GET` | `/api/shifts/department?dept={dept}` | Filter shifts by department name | `ADMIN`, `DOCTOR` |
| **Doctor Shifts** | `PUT` | `/api/shifts/{id}` | Update shift details | `ADMIN`, `DOCTOR` |
| **Doctor Shifts** | `DELETE` | `/api/shifts/{id}` | Delete a shift schedule | `ADMIN`, `DOCTOR` |
| **Medical Records** | `POST` | `/api/medical-records` | Create clinical record / attach lab report | `ADMIN`, `DOCTOR` |
| **Medical Records** | `GET` | `/api/medical-records` | List all medical records | `ADMIN`, `DOCTOR` |
| **Medical Records** | `GET` | `/api/medical-records/{id}` | Retrieve medical record by ID | `ADMIN`, `DOCTOR`, `PATIENT` |
| **Medical Records** | `GET` | `/api/medical-records/patient/{patientId}` | Retrieve medical history for a patient | `ADMIN`, `DOCTOR`, `PATIENT` |
| **Medical Records** | `GET` | `/api/medical-records/doctor/{doctorId}` | Get records authored by a doctor | `ADMIN`, `DOCTOR` |
| **Medical Records** | `DELETE` | `/api/medical-records/{id}` | Delete a medical record | `ADMIN`, `DOCTOR` |
| **Billing** | `POST` | `/api/billings` | Create invoice for an appointment | `ADMIN` |
| **Billing** | `GET` | `/api/billings` | Retrieve all billing records | `ADMIN` |
| **Billing** | `GET` | `/api/billings/{id}` | Retrieve billing invoice by ID | `ADMIN`, `PATIENT` |
| **Billing** | `GET` | `/api/billings/patient/{patientId}` | Retrieve billing invoices for a patient | `ADMIN`, `PATIENT` |
| **Billing** | `PATCH` | `/api/billings/{id}/payment-status?status={status}` | Update status (`PENDING`, `PAID`, `FAILED`) | `ADMIN`, `PATIENT` |
| **Billing** | `GET` | `/api/billings/{id}/receipt` | Download invoice PDF receipt | `ADMIN`, `PATIENT` |
| **Analytics** | `GET` | `/api/analytics/dashboard-stats` | Aggregated dashboard KPI counters | `ADMIN`, `DOCTOR` |
| **Analytics** | `GET` | `/api/analytics/appointments-per-day`| Daily appointment breakdown | `ADMIN`, `DOCTOR` |
| **Analytics** | `GET` | `/api/analytics/doctor-workload` | Patient allocation per doctor/dept | `ADMIN`, `DOCTOR` |
| **Analytics** | `GET` | `/api/analytics/patient-growth` | Cumulative patient growth over time | `ADMIN`, `DOCTOR` |
| **Analytics** | `GET` | `/api/analytics/summary` | Combined clinical analytics summary | `ADMIN`, `DOCTOR` |
| **WebSockets** | `WS` | `/ws` | STOMP WebSocket connection endpoint | Public / Authenticated |
| **Actuator** | `GET` | `/actuator/health` | Container liveness and readiness probe | Public |

---

## Screenshots & Demo

> Add your application preview screenshots into the `./docs/screenshots/` directory.

| Admin Dashboard | Appointment Scheduling |
|:---:|:---:|
| ![Admin Dashboard](./docs/screenshots/dashboard.png) | ![Appointments](./docs/screenshots/appointments.png) |

| Medical Records Timeline | Luxury Login Portal |
|:---:|:---:|
| ![Medical Records](./docs/screenshots/records.png) | ![Login Portal](./docs/screenshots/login.png) |

---

## Future Improvements

- **AI Symptom Recommendation Engine:** Implement the backend recommendation service for `POST /api/chat/recommendation` to serve automated triage suggestions to the chatbot widget.
- **Database Migrations:** Integrate Flyway or Liquibase for version-controlled database schema migrations in place of Hibernate's `ddl-auto: update`.
- **Cloud Object Storage:** Transition medical record lab attachments and PDFs from Base64 database storage to an S3-compatible object store (e.g., AWS S3, MinIO).
- **Refresh Token Rotation:** Add refresh token rotation to the authentication system to allow seamless session renewal without re-login.
- **Automated CI/CD:** Establish a GitHub Actions pipeline to run Maven unit/integration tests and build Docker images automatically on push.

---

## License

`TODO: Specify project license (e.g., MIT, Apache 2.0, or Proprietary).`

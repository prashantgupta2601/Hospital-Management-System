# 🏥 PG Care — Hospital Management System (HMS)

PG Care is a modern, enterprise-grade, secure, and AI-powered Hospital Management System. It features interactive analytics dashboards, medical records management, clinical shift tracking, appointment booking pipelines, and an intelligent AI assistant.

This repository is optimized for highly secure production deployment using multi-stage Docker containers and a containerized PostgreSQL database backend, reverse-proxied by Nginx.

---

## 🚀 Production Deployment Guide

### System Requirements
* **Docker Engine** (v24.0+) & **Docker Compose** (v2.20+)
* Core system ports `80` (HTTP) and `5432` (Postgres local admin, optional) must be available.

---

### 📥 1. Environment Setup

Copy the environment variables template and initialize your production secrets.

```bash
# Copy the environment template
cp .env.example .env
```

Open the newly created `.env` file and replace the default credentials with highly secure values:

```env
# ── Database Container Init Config (Used by postgres image) ──
POSTGRES_DB=hms
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_postgres_password_here

# ── Spring Datasource Configuration (Used by backend runtime) ──
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/hms
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_secure_postgres_password_here

# ── Security & JWT ──────────────────────────────────────────
# Generate a secure random 256-bit hexadecimal key
JWT_SECRET=your_secure_256bit_hex_secret_here
JWT_EXPIRATION_MS=86400000

# ── General Server / Spring Config ───────────────────────────
SERVER_PORT=8081
SPRING_PROFILES_ACTIVE=prod

# ── CORS ─────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:80
```

---

### 📦 2. Deployment via Docker Compose

HMS runs as a unified triple-service application suite:
1. **`postgres`**: Secure PostgreSQL database backend with a persistent local storage volume mapping.
2. **`backend`**: Enterprise Spring Boot application running inside a secure, lightweight JRE container built via multi-stage caching.
3. **`frontend`**: Hardened Nginx instance serving high-performance static frontend files and serving as a reverse proxy for all API/WebSocket communication.

Start the deployment in detached production mode:

```bash
# Build and launch all services in detached mode
docker compose up --build -d
```

Confirm that all services are healthy and running:

```bash
# List container statuses
docker compose ps
```

---

### 🔍 3. Monitoring & Operations

#### Inspect Service Logs
```bash
# Backend Spring Boot logs
docker compose logs -f backend

# Nginx frontend proxy logs
docker compose logs -f frontend

# Postgres database engine logs
docker compose logs -f postgres
```

#### Stopping and Rebuilding
```bash
# Gracefully stop the application suite without destroying data
docker compose down

# Stop the suite and purge volumes (WARNING: This destroys DB data!)
docker compose down -v
```

---

## 🛠️ Architecture & Networking Details

```
              ┌──────────────────────────────────────────────────────────┐
              │                        HOST SYSTEM                       │
              │                                                          │
              │     HTTP Requests (Port 80)                              │
              └───────┬──────────────────────────────────────────────────┘
                      │
                      ▼
        ┌───────────────────────────┐
        │     frontend (Nginx)      │
        │      (Container IP)       │
        └───────┬─────────────┬─────┘
                │             │
      Serving   │             │  Reverse proxying
   Static Files │             │  /api/* and /ws/*
                ▼             ▼
        ┌──────────────┐    ┌──────────────┐
        │  Static HTML │    │   backend    │
        │   /CSS/JS    │    │ (Spring Boot)│
        └──────────────┘    │ (Port 8081)  │
                            └──────┬───────┘
                                   │  Reads/Writes
                                   ▼
                            ┌──────────────┐
                            │   postgres   │
                            │ (Postgres DB)│
                            │ (Port 5432)  │
                            └──────────────┘
```

* **No Direct Backend Exposure**: The Spring Boot backend container resides on a private internal bridge network and is not directly accessible from the internet. All HTTP requests to `/api` and WebSocket upgrades to `/ws` are safely proxied through the Nginx layer.
* **Dynamic Frontend Environment Resolution**: Frontend requests resolve automatically via `window.location.origin` inside client JS configurations, making it environment-agnostic.

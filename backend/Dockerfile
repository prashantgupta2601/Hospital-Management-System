# ─────────────────────────────────────────────────────────────
# PG CARE HMS — Backend Dockerfile
# Multi-stage build: Maven build → lightweight JRE runtime
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Build ───────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom.xml first (layer caching for deps)
COPY pom.xml .
COPY mvnw* ./
COPY .mvn/ .mvn/ 2>/dev/null || true

# Download dependencies (cached unless pom.xml changes)
# Fallback to system mvn if mvnw is absent
RUN if [ -f "mvnw" ]; then \
        chmod +x mvnw && ./mvnw dependency:go-offline -B --no-transfer-progress; \
    else \
        apk add --no-cache maven && mvn dependency:go-offline -B --no-transfer-progress; \
    fi

# Copy source and build
COPY src/ src/

RUN if [ -f "mvnw" ]; then \
        ./mvnw package -DskipTests --no-transfer-progress; \
    else \
        mvn package -DskipTests --no-transfer-progress; \
    fi

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

# Security: run as non-root user
RUN addgroup -S hms && adduser -S hms -G hms

WORKDIR /app

# Copy the built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Set ownership
RUN chown hms:hms app.jar

USER hms

# Expose backend port
EXPOSE 8081

# JVM tuning for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Health check using Actuator
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8081/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

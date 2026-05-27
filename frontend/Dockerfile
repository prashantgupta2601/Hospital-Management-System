# ─────────────────────────────────────────────────────────────
# PG CARE HMS — Frontend Dockerfile
# Serves static HTML/CSS/JS via Nginx
# ─────────────────────────────────────────────────────────────

FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/hms.conf

# Copy all frontend static files
COPY . /usr/share/nginx/html/

# Expose HTTP port
EXPOSE 80

# Health check — nginx serves a /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

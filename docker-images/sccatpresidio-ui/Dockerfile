# Multi-stage Dockerfile for Presidio Enterprise UI
# Stage 1: Build React application
FROM registry.access.redhat.com/ubi9/nodejs-18:latest AS builder

USER 0

# Set working directory
WORKDIR /app

# Copy the presidio-enterprise-ui source code
COPY --chown=1000:0 ../../presidio-enterprise-ui/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY --chown=1000:0 ../../presidio-enterprise-ui/ ./

# Build the React application
RUN npm run build

# Stage 2: Production image with Nginx
FROM registry.access.redhat.com/ubi9/nginx-122:latest

# Metadata
LABEL name="sccatpresidio-ui" \
      vendor="IBM Sovereign Core" \
      version="1.0.0" \
      summary="Presidio Enterprise UI on Red Hat UBI" \
      description="React-based enterprise UI for Microsoft Presidio PII detection and anonymization"

USER 0

# Copy built React app from builder stage
COPY --from=builder --chown=1000:0 /app/dist /opt/app-root/src

# Create nginx configuration
RUN cat > /etc/nginx/nginx.conf <<'EOF'
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    server {
        listen       8080 default_server;
        listen       [::]:8080 default_server;
        server_name  _;
        root         /opt/app-root/src;
        index        index.html;

        # Serve static files
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy API requests to analyzer service
        location /api/analyzer/ {
            proxy_pass http://analyzer:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Proxy API requests to anonymizer service
        location /api/anonymizer/ {
            proxy_pass http://anonymizer:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Set permissions
RUN chown -R 1000:0 /opt/app-root/src && \
    chmod -R g=u /opt/app-root/src && \
    chown -R 1000:0 /etc/nginx && \
    chmod -R g=u /etc/nginx && \
    chown -R 1000:0 /var/log/nginx && \
    chmod -R g=u /var/log/nginx && \
    chown -R 1000:0 /run && \
    chmod -R g=u /run

# Switch to non-root user
USER 1000

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Made with Bob
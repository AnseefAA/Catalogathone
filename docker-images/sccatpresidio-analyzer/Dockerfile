# Presidio Analyzer - Built on Red Hat UBI 9 Python
FROM registry.access.redhat.com/ubi9/python-311:latest

# Metadata
LABEL name="sccatpresidio-analyzer" \
      vendor="IBM Sovereign Core" \
      version="2.2.0" \
      summary="Presidio Analyzer for PII detection on Red Hat UBI" \
      description="Microsoft Presidio Analyzer service rebuilt on Red Hat Universal Base Image for sovereign cloud compliance"

USER 0

# Install system dependencies
RUN dnf install -y --nodocs \
    gcc \
    gcc-c++ \
    make \
    && dnf clean all \
    && rm -rf /var/cache/dnf

# Create app directory and set ownership
RUN mkdir -p /opt/app-root/presidio && \
    chown -R 1000:0 /opt/app-root/presidio && \
    chmod -R g=u /opt/app-root/presidio

# Copy application files and make executable (as root)
COPY app.py /opt/app-root/presidio/app.py
COPY start.sh /opt/app-root/presidio/start.sh
RUN chmod +x /opt/app-root/presidio/start.sh && \
    chown -R 1000:0 /opt/app-root/presidio

WORKDIR /opt/app-root/presidio

# Switch to non-root user
USER 1000

# Install Presidio Analyzer and dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    presidio-analyzer==2.2.362 \
    spacy==3.7.2 \
    fastapi==0.109.2 \
    uvicorn[standard]==0.27.1 \
    python-multipart==0.0.9 && \
    pip install --no-cache-dir \
    https://github.com/explosion/spacy-models/releases/download/en_core_web_lg-3.7.1/en_core_web_lg-3.7.1-py3-none-any.whl

# Set environment variables
ENV PORT=3000 \
    GRPC_PORT=3001 \
    LOG_LEVEL=info \
    PYTHONUNBUFFERED=1

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run the analyzer service
CMD ["/opt/app-root/presidio/start.sh"]
# Presidio Enterprise UI - Deployment Guide

This guide covers deployment options for the Presidio Enterprise UI in hybrid cloud environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [OpenShift Deployment](#openshift-deployment)
6. [Cloud Provider Deployments](#cloud-provider-deployments)
7. [Configuration](#configuration)
8. [Security Considerations](#security-considerations)
9. [Monitoring & Logging](#monitoring--logging)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ (for local development)
- Docker 20+ (for containerized deployment)
- Kubernetes 1.24+ or OpenShift 4.10+
- Presidio Analyzer and Anonymizer services deployed
- kubectl or oc CLI configured

## Local Development

### Setup

```bash
# Clone and navigate to the project
cd presidio-enterprise-ui

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your service URLs
nano .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## Docker Deployment

### Build Docker Image

Create a `Dockerfile`:

```dockerfile
# Multi-stage build for optimized image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # API proxy
        location /api/analyzer {
            proxy_pass http://presidio-analyzer:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/anonymizer {
            proxy_pass http://presidio-anonymizer:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Build and Run

```bash
# Build image
docker build -t presidio-enterprise-ui:latest .

# Run container
docker run -d \
  --name presidio-ui \
  -p 8080:80 \
  --network presidio-network \
  presidio-enterprise-ui:latest

# View logs
docker logs -f presidio-ui
```

## Kubernetes Deployment

### Deployment Manifest

Create `k8s-deployment.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: presidio-ui

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: presidio-ui-config
  namespace: presidio-ui
data:
  ANALYZER_URL: "http://presidio-analyzer.presidio.svc.cluster.local:3000"
  ANONYMIZER_URL: "http://presidio-anonymizer.presidio.svc.cluster.local:3000"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: presidio-ui
  namespace: presidio-ui
  labels:
    app: presidio-ui
    component: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: presidio-ui
  template:
    metadata:
      labels:
        app: presidio-ui
        component: frontend
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 101
        fsGroup: 101
      containers:
      - name: presidio-ui
        image: presidio-enterprise-ui:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
          name: http
          protocol: TCP
        envFrom:
        - configMapRef:
            name: presidio-ui-config
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL

---
apiVersion: v1
kind: Service
metadata:
  name: presidio-ui
  namespace: presidio-ui
  labels:
    app: presidio-ui
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  selector:
    app: presidio-ui

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: presidio-ui
  namespace: presidio-ui
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - presidio.example.com
    secretName: presidio-ui-tls
  rules:
  - host: presidio.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: presidio-ui
            port:
              number: 80

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: presidio-ui
  namespace: presidio-ui
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: presidio-ui
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s-deployment.yaml

# Check deployment status
kubectl get pods -n presidio-ui
kubectl get svc -n presidio-ui
kubectl get ingress -n presidio-ui

# View logs
kubectl logs -f deployment/presidio-ui -n presidio-ui

# Scale deployment
kubectl scale deployment presidio-ui -n presidio-ui --replicas=3
```

## OpenShift Deployment

### Create OpenShift Resources

```bash
# Create new project
oc new-project presidio-ui

# Create from Docker image
oc new-app presidio-enterprise-ui:latest --name=presidio-ui

# Expose service
oc expose svc/presidio-ui

# Get route URL
oc get route presidio-ui
```

### Using OpenShift Template

Create `openshift-template.yaml`:

```yaml
apiVersion: template.openshift.io/v1
kind: Template
metadata:
  name: presidio-ui-template
objects:
- apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: presidio-ui
  spec:
    replicas: ${{REPLICAS}}
    selector:
      matchLabels:
        app: presidio-ui
    template:
      metadata:
        labels:
          app: presidio-ui
      spec:
        containers:
        - name: presidio-ui
          image: ${IMAGE}:${IMAGE_TAG}
          ports:
          - containerPort: 80
          resources:
            requests:
              cpu: ${CPU_REQUEST}
              memory: ${MEMORY_REQUEST}
            limits:
              cpu: ${CPU_LIMIT}
              memory: ${MEMORY_LIMIT}
- apiVersion: v1
  kind: Service
  metadata:
    name: presidio-ui
  spec:
    ports:
    - port: 80
      targetPort: 80
    selector:
      app: presidio-ui
- apiVersion: route.openshift.io/v1
  kind: Route
  metadata:
    name: presidio-ui
  spec:
    to:
      kind: Service
      name: presidio-ui
    tls:
      termination: edge
parameters:
- name: IMAGE
  value: presidio-enterprise-ui
- name: IMAGE_TAG
  value: latest
- name: REPLICAS
  value: "2"
- name: CPU_REQUEST
  value: "100m"
- name: MEMORY_REQUEST
  value: "128Mi"
- name: CPU_LIMIT
  value: "500m"
- name: MEMORY_LIMIT
  value: "512Mi"
```

Deploy:

```bash
oc process -f openshift-template.yaml | oc apply -f -
```

## Cloud Provider Deployments

### AWS EKS

```bash
# Create EKS cluster
eksctl create cluster --name presidio-cluster --region us-east-1

# Deploy application
kubectl apply -f k8s-deployment.yaml

# Create ALB Ingress
kubectl apply -f aws-alb-ingress.yaml
```

### Azure AKS

```bash
# Create AKS cluster
az aks create --resource-group presidio-rg --name presidio-cluster

# Get credentials
az aks get-credentials --resource-group presidio-rg --name presidio-cluster

# Deploy application
kubectl apply -f k8s-deployment.yaml
```

### Google GKE

```bash
# Create GKE cluster
gcloud container clusters create presidio-cluster --zone us-central1-a

# Deploy application
kubectl apply -f k8s-deployment.yaml
```

## Configuration

### Environment Variables

Set these in your deployment:

- `ANALYZER_URL`: Presidio Analyzer service URL
- `ANONYMIZER_URL`: Presidio Anonymizer service URL
- `API_BASE_URL`: Base URL for API requests
- `SESSION_TIMEOUT`: Session timeout in milliseconds
- `MAX_FILE_SIZE_MB`: Maximum file upload size

### ConfigMap Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: presidio-ui-config
data:
  analyzer.url: "http://presidio-analyzer:3000"
  anonymizer.url: "http://presidio-anonymizer:3000"
  max.file.size: "100"
  session.timeout: "3600000"
```

## Security Considerations

1. **TLS/SSL**: Always use HTTPS in production
2. **Authentication**: Implement OAuth2/OIDC
3. **RBAC**: Configure role-based access control
4. **Network Policies**: Restrict pod-to-pod communication
5. **Secrets Management**: Use Kubernetes Secrets or external vaults
6. **Container Security**: Run as non-root, read-only filesystem
7. **Image Scanning**: Scan images for vulnerabilities

## Monitoring & Logging

### Prometheus Metrics

```yaml
apiVersion: v1
kind: Service
metadata:
  name: presidio-ui-metrics
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "80"
    prometheus.io/path: "/metrics"
spec:
  selector:
    app: presidio-ui
  ports:
  - port: 80
```

### Logging with Fluentd

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/presidio-ui*.log
      pos_file /var/log/fluentd-presidio-ui.pos
      tag presidio.ui
      <parse>
        @type json
      </parse>
    </source>
```

## Troubleshooting

### Common Issues

**Issue**: Pods not starting
```bash
kubectl describe pod <pod-name> -n presidio-ui
kubectl logs <pod-name> -n presidio-ui
```

**Issue**: Cannot connect to backend services
```bash
# Test connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://presidio-analyzer:3000/health
```

**Issue**: High memory usage
```bash
# Check resource usage
kubectl top pods -n presidio-ui

# Adjust resource limits
kubectl set resources deployment presidio-ui -n presidio-ui --limits=memory=1Gi
```

### Health Checks

```bash
# Check application health
curl http://presidio-ui/health

# Check backend connectivity
curl http://presidio-ui/api/analyzer/health
curl http://presidio-ui/api/anonymizer/health
```

## Backup and Recovery

### Backup Configuration

```bash
# Export all resources
kubectl get all -n presidio-ui -o yaml > presidio-ui-backup.yaml

# Backup ConfigMaps and Secrets
kubectl get configmap,secret -n presidio-ui -o yaml > presidio-ui-config-backup.yaml
```

### Restore

```bash
# Restore from backup
kubectl apply -f presidio-ui-backup.yaml
kubectl apply -f presidio-ui-config-backup.yaml
```

## Support

For deployment issues:
- Check logs: `kubectl logs -f deployment/presidio-ui -n presidio-ui`
- Review events: `kubectl get events -n presidio-ui`
- Contact support team with deployment details

---

**Last Updated**: 2026-04-28  
**Version**: 1.0.0
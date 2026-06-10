# Presidio Enterprise UI

A comprehensive Native Enterprise UI for Microsoft Presidio - PII Detection & Data Protection Platform designed for hybrid cloud environments with sovereign compliance requirements.

## 🎯 Overview

Presidio Enterprise UI provides a complete web-based interface for managing PII detection, anonymization, and data protection across hybrid cloud deployments. Built with React, TypeScript, and modern web technologies, it offers enterprise-grade features for compliance, monitoring, and multi-cluster management.

## ✨ Features

### Core Capabilities
- **PII Detection & Analysis** - Real-time text analysis with support for 10+ languages
- **Data Anonymization** - Multiple strategies (mask, replace, redact, hash, encrypt)
- **Batch Processing** - Upload and process multiple files simultaneously
- **Instance Management** - Deploy and manage Presidio instances across clusters
- **Multi-Cluster Support** - Manage deployments across Kubernetes, OpenShift, EKS, AKS, GKE
- **Real-time Monitoring** - Metrics, alerts, and health monitoring
- **Compliance & Audit** - Comprehensive audit logs and compliance reporting
- **User Management** - Role-based access control (RBAC)
- **Configuration Management** - Centralized system configuration

### Enterprise Features
- **Hybrid Cloud Ready** - Deploy across on-premises and cloud environments
- **Sovereign Compliance** - All processing within sovereign boundaries
- **High Availability** - Multi-replica deployments with health checks
- **Scalability** - Auto-scaling based on workload
- **Security** - Non-root containers, read-only filesystems, network policies
- **Metering & Billing** - Usage tracking and cost allocation

## 🏗️ Architecture

```
presidio-enterprise-ui/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── Layout.tsx       # Main application layout
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Overview dashboard
│   │   ├── Analyzer.tsx     # PII detection interface
│   │   ├── Anonymizer.tsx   # Data anonymization interface
│   │   ├── BatchProcessing.tsx  # Batch file processing
│   │   ├── Instances.tsx    # Instance management
│   │   ├── Monitoring.tsx   # Metrics and monitoring
│   │   ├── Compliance.tsx   # Audit logs and reports
│   │   ├── Clusters.tsx     # Multi-cluster management
│   │   ├── Configuration.tsx # System configuration
│   │   └── Users.tsx        # User management
│   ├── lib/
│   │   ├── api.ts           # API client and endpoints
│   │   └── utils.ts         # Utility functions
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Presidio Analyzer service running (default: http://localhost:3001)
- Presidio Anonymizer service running (default: http://localhost:3002)

### Installation

```bash
# Clone the repository
cd presidio-enterprise-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_ANALYZER_URL=http://localhost:3001
VITE_ANONYMIZER_URL=http://localhost:3002
VITE_API_BASE_URL=/api
```

### API Proxy Configuration

The Vite dev server is configured to proxy API requests:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api/analyzer': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
    '/api/anonymizer': {
      target: 'http://localhost:3002',
      changeOrigin: true,
    },
  },
}
```

## 📖 Usage Guide

### PII Detection

1. Navigate to **PII Analyzer** page
2. Enter or paste text to analyze
3. Select language and confidence threshold
4. Click "Analyze" to detect PII entities
5. View detected entities with scores and positions

### Data Anonymization

1. Navigate to **Anonymizer** page
2. Enter text or upload file
3. Select anonymization strategy (mask, replace, redact, hash)
4. Configure entity-specific operators
5. Click "Anonymize" to protect sensitive data
6. Download or copy anonymized results

### Batch Processing

1. Navigate to **Batch Processing** page
2. Upload multiple files (drag & drop or browse)
3. Configure processing options
4. Monitor job progress in real-time
5. Download processed results as ZIP

### Instance Management

1. Navigate to **Instances** page
2. View all deployed Presidio instances
3. Create new instance with custom configuration
4. Start, stop, restart, or delete instances
5. Monitor instance health and metrics

### Multi-Cluster Management

1. Navigate to **Clusters** page
2. Add new Kubernetes/OpenShift clusters
3. Test cluster connectivity
4. Deploy instances to specific clusters
5. View cluster-wide metrics

### Compliance & Audit

1. Navigate to **Compliance** page
2. View audit logs with filtering
3. Generate compliance reports
4. Export reports (PDF, CSV, JSON)
5. Monitor compliance score

## 🎨 UI Components

### Dashboard
- System overview with key metrics
- Active instances count
- PII detection statistics
- Compliance score
- Recent activity feed
- Quick action buttons

### Analyzer
- Text input with syntax highlighting
- Language selection (10+ languages)
- Confidence threshold slider
- Entity type filtering
- Results visualization
- Export capabilities

### Anonymizer
- Combined analyze + anonymize workflow
- Strategy selection per entity type
- Preview before/after comparison
- Batch file processing
- Download anonymized results

### Monitoring
- Real-time metrics charts
- CPU and memory usage
- API call statistics
- PII detection trends
- Alert management
- Time range selection

## 🔐 Security Features

- **Authentication** - JWT-based authentication
- **Authorization** - Role-based access control (RBAC)
- **Audit Logging** - All operations logged
- **Data Encryption** - TLS/SSL for all communications
- **Session Management** - Secure session handling
- **CORS Protection** - Configured CORS policies

## 📊 Monitoring & Metrics

### Tracked Metrics
- `analyzer_api_calls` - Total analyzer API calls
- `anonymizer_api_calls` - Total anonymizer API calls
- `data_processed_bytes` - Volume of data processed
- `pii_entities_detected` - Number of PII entities found
- `pii_entities_anonymized` - Number of PII entities protected
- `cpu_usage_cores` - CPU consumption
- `memory_usage_gb` - Memory consumption

### Alerts
- High resource usage
- Service health issues
- Compliance violations
- Failed operations

## 🌍 Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Dutch (nl)
- Hebrew (he)
- Japanese (ja)
- Chinese (zh)

## 🔄 API Integration

The UI integrates with Presidio services via REST APIs:

### Analyzer API
- `POST /analyze` - Analyze text for PII
- `POST /analyze/file` - Analyze uploaded file
- `GET /health` - Health check

### Anonymizer API
- `POST /anonymize` - Anonymize with analyzer results
- `POST /process` - Combined analyze + anonymize
- `POST /process/file` - Process uploaded file
- `GET /health` - Health check

### Management API
- Instance CRUD operations
- Cluster management
- User management
- Configuration management
- Monitoring and metrics
- Compliance and audit logs

## 🛠️ Development

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Code Editor**: Monaco Editor
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 📦 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: presidio-ui
spec:
  replicas: 2
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
        image: presidio-ui:latest
        ports:
        - containerPort: 80
        env:
        - name: ANALYZER_URL
          value: "http://presidio-analyzer:3000"
        - name: ANONYMIZER_URL
          value: "http://presidio-anonymizer:3000"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of IBM Sovereign Core and follows the project's licensing terms.

## 🆘 Support

For issues, questions, or contributions:
- Review the [Presidio Documentation](https://microsoft.github.io/presidio/)
- Check the [Sovereign Core Catalog Guide](https://github.ibm.com/SovereignCore/catalogathon-guide)
- Submit issues to the repository
- Contact the Sovereign Core support team

## 🔗 Related Projects

- [Microsoft Presidio](https://github.com/microsoft/presidio) - Core PII detection engine
- [Presidio Analyzer](../docker-images/sccatpresidio-analyzer/) - Analyzer service
- [Presidio Anonymizer](../docker-images/sccatpresidio-anonymizer/) - Anonymizer service
- [Sovereign Core Catalog](../catalogathon-gitops-run/) - Service catalog

## 📝 Version History

- **v1.0.0** (2026-04-28)
  - Initial release
  - Complete enterprise UI implementation
  - Multi-cluster support
  - Compliance and audit features
  - Batch processing capabilities

---

**Made with ❤️ for Sovereign Core by Bob**
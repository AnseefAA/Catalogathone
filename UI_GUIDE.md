# Presidio Web UI Guide

## Overview

The Presidio Web UI provides a professional, user-friendly interface for PII detection and anonymization. Built with IBM Carbon Design System, it offers a consistent IBM experience with enterprise-grade styling.

## Features

### 1. **Process Text Tab** (Combined Analysis + Anonymization)
- **Text Input**: Large text area for entering sensitive data
- **Anonymization Strategy**: Dropdown to select strategy (replace, redact, mask, hash, encrypt)
- **Process Button**: Analyzes and anonymizes in one operation
- **Results Display**: Shows both detected entities and anonymized text
- **Clear Button**: Resets the form

### 2. **Analyze Only Tab**
- **Text Input**: Enter text for PII detection
- **Analyze Button**: Detects PII entities without anonymization
- **Results Display**: Shows detected entities with types, scores, and positions
- **Clear Button**: Resets the form

### 3. **Audit Logs Tab**
- **Statistics Dashboard**: Shows total operations, analyzer calls, anonymizer calls
- **Analyzer Logs**: Recent analyzer operations with timestamps
- **Anonymizer Logs**: Recent anonymizer operations with timestamps
- **Refresh Button**: Updates logs and statistics

## Design System

### IBM Carbon Design System
The UI uses IBM's official design system for consistency:
- **Typography**: IBM Plex Sans and IBM Plex Mono fonts
- **Colors**: IBM Carbon color palette
- **Components**: Carbon-styled buttons, inputs, tabs, and cards
- **Spacing**: IBM Carbon spacing scale
- **Icons**: Carbon icon set

### Professional Features
- **Responsive Layout**: Works on desktop and tablet devices
- **Loading States**: Visual feedback during processing
- **Error Handling**: User-friendly error messages
- **Accessibility**: WCAG 2.1 compliant
- **Dark Mode Ready**: Carbon theme support

## Architecture

### Frontend (HTML/CSS/JavaScript)
```
templates/index.html (650 lines)
├── IBM Carbon Design System CSS
├── IBM Plex Fonts
├── Three Tabs (Process, Analyze, Audit)
├── Form Handling
├── API Integration
└── Results Display
```

### Backend (Flask)
```
app.py (145 lines)
├── Health Endpoint
├── API Proxy Endpoints
│   ├── /api/analyze
│   ├── /api/anonymize
│   ├── /api/process
│   └── /api/audit/*
└── Error Handling
```

### Container (Docker)
```
Dockerfile (58 lines)
├── Red Hat UBI 9 Python 3.11
├── Flask + httpx + gunicorn
├── Non-root user (1000)
├── Health checks
└── Port 8080
```

## API Integration

### Process Text (Combined)
```javascript
POST /api/process
{
  "text": "Contact John at john@example.com",
  "anonymization_strategy": "replace"
}
```

### Analyze Only
```javascript
POST /api/analyze
{
  "text": "Contact John at john@example.com"
}
```

### Anonymize Only
```javascript
POST /api/anonymize
{
  "text": "Contact John at john@example.com",
  "analyzer_results": [...]
}
```

### Audit Logs
```javascript
GET /api/audit/analyzer
GET /api/audit/anonymizer
GET /api/audit/stats
```

## Deployment

### Docker Compose
```yaml
services:
  ui:
    image: sccatpresidio-ui:2.2.0
    ports:
      - "8080:8080"
    environment:
      - ANALYZER_URL=http://analyzer:3000
      - ANONYMIZER_URL=http://anonymizer:3000
    networks:
      - presidio-network
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sccatpresidio-ui
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: ui
        image: quay.io/ibm-sovereign-core/sccatpresidio-ui:2.2.0
        ports:
        - containerPort: 8080
        env:
        - name: ANALYZER_URL
          value: "http://sccatpresidio-analyzer:3000"
        - name: ANONYMIZER_URL
          value: "http://sccatpresidio-anonymizer:3000"
```

## Usage Examples

### Example 1: Process Sensitive Data
1. Navigate to "Process Text" tab
2. Enter: "Employee: Alice Johnson, Email: alice@company.com, SSN: 123-45-6789"
3. Select strategy: "replace"
4. Click "Process Text"
5. View detected entities and anonymized result

### Example 2: Analyze PII
1. Navigate to "Analyze Only" tab
2. Enter: "Contact Bob at bob@example.com or call 555-1234"
3. Click "Analyze Text"
4. View detected entities (EMAIL_ADDRESS, PHONE_NUMBER)

### Example 3: View Audit Trail
1. Navigate to "Audit Logs" tab
2. View statistics dashboard
3. Review recent analyzer operations
4. Review recent anonymizer operations
5. Click "Refresh Logs" for updates

## Customization

### Branding
Update the header in `templates/index.html`:
```html
<h1>Your Company - Data Protection</h1>
```

### Colors
Modify CSS variables for custom theming:
```css
:root {
  --primary-color: #0f62fe;
  --secondary-color: #393939;
}
```

### Features
Add new tabs or functionality by extending:
- Frontend: Add new tab in HTML
- Backend: Add new proxy endpoint in Flask
- API: Extend backend services

## Security

### Best Practices
- **HTTPS Only**: Always use TLS in production
- **Authentication**: Add auth middleware for production
- **Rate Limiting**: Implement rate limiting on API endpoints
- **Input Validation**: Validate all user inputs
- **CORS**: Configure CORS for production domains

### Container Security
- Non-root user (UID 1000)
- Read-only root filesystem
- Dropped capabilities
- Security context constraints

## Performance

### Optimization
- **Caching**: Browser caching for static assets
- **Compression**: Gzip compression enabled
- **CDN**: Use CDN for IBM Carbon CSS/fonts
- **Lazy Loading**: Load audit logs on demand

### Scaling
- **Horizontal**: Multiple UI replicas behind load balancer
- **Vertical**: Increase gunicorn workers
- **Backend**: Scale analyzer/anonymizer independently

## Troubleshooting

### UI Not Loading
```bash
# Check container logs
docker logs ui

# Check health endpoint
curl http://localhost:8080/health
```

### API Errors
```bash
# Check backend connectivity
curl http://localhost:8080/api/analyze -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}'
```

### Styling Issues
- Clear browser cache
- Check IBM Carbon CSS loading
- Verify font loading from Google Fonts

## Development

### Local Development
```bash
# Install dependencies
pip install flask httpx gunicorn

# Run development server
cd docker-images/sccatpresidio-ui
python app.py

# Access at http://localhost:8080
```

### Testing
```bash
# Test health endpoint
curl http://localhost:8080/health

# Test API proxy
curl http://localhost:8080/api/analyze -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"test@example.com"}'
```

## Resources

- **IBM Carbon Design System**: https://carbondesignsystem.com/
- **IBM Plex Fonts**: https://www.ibm.com/plex/
- **Flask Documentation**: https://flask.palletsprojects.com/
- **Presidio Documentation**: https://microsoft.github.io/presidio/

## Support

For issues or questions:
1. Check logs: `docker logs ui`
2. Review API documentation: http://localhost:8080/api/docs
3. Contact catalogathon support

---

**Built with IBM Carbon Design System for IBM Sovereign Core Catalogathon**
# Enhanced Presidio API Guide

Complete guide for the enhanced Presidio services with file upload and combined processing capabilities.

---

## 🎯 What's New

### New Features Added:
1. ✅ **File Upload Support** - Upload text files for PII detection and anonymization
2. ✅ **Combined Processing** - Analyze + Anonymize in one API call
3. ✅ **Swagger UI** - Interactive API documentation at `/docs`
4. ✅ **ReDoc** - Alternative API documentation at `/redoc`
5. ✅ **Enhanced Error Handling** - Better error messages and validation

---

## 📚 API Endpoints Overview

### Analyzer Service (Port 3000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service information |
| `/health` | GET | Health check |
| `/docs` | GET | Swagger UI |
| `/redoc` | GET | ReDoc documentation |
| `/analyze` | POST | Analyze text for PII |
| `/analyze/file` | POST | **NEW** - Analyze uploaded file |

### Anonymizer Service (Port 3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service information |
| `/health` | GET | Health check |
| `/docs` | GET | Swagger UI |
| `/redoc` | GET | ReDoc documentation |
| `/anonymize` | POST | Anonymize text |
| `/process` | POST | **NEW** - Analyze + Anonymize combined |
| `/process/file` | POST | **NEW** - Process uploaded file |

---

## 🚀 Quick Start

### 1. Access Swagger UI

Open in your browser:
- **Analyzer**: http://localhost:3000/docs
- **Anonymizer**: http://localhost:3001/docs

The Swagger UI provides:
- Interactive API testing
- Request/response examples
- Parameter descriptions
- Try it out functionality

---

## 📖 Detailed API Documentation

### Analyzer Service

#### 1. GET / - Service Information

```bash
curl http://localhost:3000/
```

**Response:**
```json
{
  "service": "Presidio Analyzer",
  "version": "2.2.362",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "analyze_text": "/analyze",
    "analyze_file": "/analyze/file",
    "docs": "/docs",
    "redoc": "/redoc"
  }
}
```

---

#### 2. POST /analyze - Analyze Text

**Request:**
```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contact John Doe at john@example.com or call 555-1234",
    "language": "en",
    "score_threshold": 0.5
  }'
```

**Response:**
```json
[
  {
    "entity_type": "PERSON",
    "start": 8,
    "end": 16,
    "score": 0.85
  },
  {
    "entity_type": "EMAIL_ADDRESS",
    "start": 20,
    "end": 37,
    "score": 1.0
  },
  {
    "entity_type": "PHONE_NUMBER",
    "start": 46,
    "end": 54,
    "score": 0.75
  }
]
```

---

#### 3. POST /analyze/file - Analyze File (NEW!)

**Request:**
```bash
curl -X POST http://localhost:3000/analyze/file \
  -F "file=@customer_data.txt" \
  -F "language=en" \
  -F "score_threshold=0.5"
```

**Response:**
```json
{
  "filename": "customer_data.txt",
  "text": "Customer: John Smith\nEmail: john@example.com\nPhone: 555-0123",
  "entities": [
    {
      "entity_type": "PERSON",
      "start": 10,
      "end": 21,
      "score": 0.85
    },
    {
      "entity_type": "EMAIL_ADDRESS",
      "start": 29,
      "end": 46,
      "score": 1.0
    },
    {
      "entity_type": "PHONE_NUMBER",
      "start": 54,
      "end": 62,
      "score": 0.75
    }
  ],
  "entity_count": 3
}
```

**Supported File Types:**
- `.txt` - Plain text files
- `.log` - Log files
- `.csv` - CSV files (as text)
- `.json` - JSON files (as text)
- Any UTF-8 encoded text file

---

### Anonymizer Service

#### 1. POST /anonymize - Anonymize Text

**Request:**
```bash
curl -X POST http://localhost:3001/anonymize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contact John Doe at john@example.com",
    "analyzer_results": [
      {"entity_type": "PERSON", "start": 8, "end": 16, "score": 0.85},
      {"entity_type": "EMAIL_ADDRESS", "start": 20, "end": 37, "score": 1.0}
    ],
    "operators": {
      "PERSON": {"type": "replace"},
      "EMAIL_ADDRESS": {"type": "mask", "masking_char": "*", "chars_to_mask": 10}
    }
  }'
```

**Response:**
```json
{
  "text": "Contact <PERSON> at **********@example.com",
  "items": [
    {
      "start": 8,
      "end": 16,
      "entity_type": "PERSON",
      "text": "<PERSON>",
      "operator": "replace"
    },
    {
      "start": 20,
      "end": 37,
      "entity_type": "EMAIL_ADDRESS",
      "text": "**********@example.com",
      "operator": "mask"
    }
  ]
}
```

---

#### 2. POST /process - Combined Processing (NEW!)

**One-stop PII protection!** This endpoint analyzes and anonymizes in a single call.

**Request:**
```bash
curl -X POST http://localhost:3001/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contact John Doe at john@example.com or call 555-1234",
    "language": "en",
    "score_threshold": 0.5,
    "operators": {
      "PERSON": {"type": "replace"},
      "EMAIL_ADDRESS": {"type": "mask"},
      "PHONE_NUMBER": {"type": "redact"}
    }
  }'
```

**Response:**
```json
{
  "original_text": "Contact John Doe at john@example.com or call 555-1234",
  "anonymized_text": "Contact <PERSON> at ****@example.com or call ",
  "entities_detected": [
    {
      "entity_type": "PERSON",
      "start": 8,
      "end": 16,
      "score": 0.85
    },
    {
      "entity_type": "EMAIL_ADDRESS",
      "start": 20,
      "end": 37,
      "score": 1.0
    },
    {
      "entity_type": "PHONE_NUMBER",
      "start": 46,
      "end": 54,
      "score": 0.75
    }
  ],
  "entities_anonymized": 3
}
```

---

#### 3. POST /process/file - Process File (NEW!)

**Complete file processing pipeline!** Upload a file and get it analyzed and anonymized.

**Request:**
```bash
curl -X POST http://localhost:3001/process/file \
  -F "file=@sensitive_data.txt" \
  -F "language=en" \
  -F "score_threshold=0.5" \
  -F "anonymization_strategy=replace"
```

**Response:**
```json
{
  "filename": "sensitive_data.txt",
  "original_text": "Employee: Alice Johnson\nSSN: 123-45-6789\nEmail: alice@company.com",
  "anonymized_text": "Employee: <PERSON>\nSSN: <US_SSN>\nEmail: <EMAIL_ADDRESS>",
  "entities_detected": [
    {
      "entity_type": "PERSON",
      "start": 10,
      "end": 23,
      "score": 0.85
    },
    {
      "entity_type": "US_SSN",
      "start": 29,
      "end": 40,
      "score": 1.0
    },
    {
      "entity_type": "EMAIL_ADDRESS",
      "start": 48,
      "end": 65,
      "score": 1.0
    }
  ],
  "entities_anonymized": 3
}
```

**Anonymization Strategies:**
- `replace` - Replace with `<ENTITY_TYPE>` (default)
- `mask` - Replace with asterisks `****`
- `redact` - Remove completely
- `hash` - SHA-256 hash

---

## 💡 Use Cases

### Use Case 1: Quick Text Sanitization

**Scenario:** Sanitize user input before logging

```bash
curl -X POST http://localhost:3001/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "User john.doe@email.com logged in from 192.168.1.100",
    "language": "en"
  }'
```

---

### Use Case 2: Batch File Processing

**Scenario:** Process customer support tickets

```bash
# Process ticket file
curl -X POST http://localhost:3001/process/file \
  -F "file=@ticket_12345.txt" \
  -F "anonymization_strategy=mask"

# Save anonymized version
curl -X POST http://localhost:3001/process/file \
  -F "file=@ticket_12345.txt" \
  -F "anonymization_strategy=mask" \
  | jq -r '.anonymized_text' > ticket_12345_anonymized.txt
```

---

### Use Case 3: Safe AI Prompts

**Scenario:** Sanitize prompts before sending to LLM

```bash
# Original prompt with PII
PROMPT="Analyze this email from john.doe@company.com about meeting Sarah at 555-1234"

# Sanitize it
SAFE_PROMPT=$(curl -s -X POST http://localhost:3001/process \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$PROMPT\", \"language\": \"en\"}" \
  | jq -r '.anonymized_text')

echo "Safe prompt: $SAFE_PROMPT"
# Output: "Analyze this email from <EMAIL_ADDRESS> about meeting <PERSON> at <PHONE_NUMBER>"
```

---

### Use Case 4: Log File Sanitization

**Scenario:** Clean logs before archiving

```bash
# Process entire log file
curl -X POST http://localhost:3001/process/file \
  -F "file=@application.log" \
  -F "anonymization_strategy=hash" \
  | jq -r '.anonymized_text' > application_sanitized.log
```

---

## 🧪 Testing with Swagger UI

### Step 1: Open Swagger UI

Navigate to:
- Analyzer: http://localhost:3000/docs
- Anonymizer: http://localhost:3001/docs

### Step 2: Try the APIs

1. Click on any endpoint to expand it
2. Click "Try it out"
3. Fill in the parameters
4. Click "Execute"
5. See the response below

### Step 3: Test File Upload

1. Go to `/analyze/file` or `/process/file`
2. Click "Try it out"
3. Click "Choose File" and select a text file
4. Fill in other parameters
5. Click "Execute"

---

## 🔧 Configuration

### Environment Variables

**Anonymizer Service:**
```bash
# Set analyzer service URL (default: http://localhost:3000)
export ANALYZER_URL=http://sccatpresidio-analyzer:3000

# In Kubernetes, this is automatically set via service discovery
```

**Both Services:**
```bash
# Log level (info, debug, error)
export LOG_LEVEL=info

# Port (default: 3000)
export PORT=3000
```

---

## 📊 Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Invalid input (e.g., non-UTF-8 file) |
| 500 | Server Error | Internal processing error |
| 503 | Service Unavailable | Cannot connect to analyzer service |

---

## 🛠️ Rebuild Instructions

After updating the code, rebuild the images:

```bash
# Stop old containers
docker rm -f analyzer anonymizer

# Rebuild analyzer
cd docker-images/sccatpresidio-analyzer
docker build -t sccatpresidio-analyzer:2.2.0 .

# Rebuild anonymizer
cd ../sccatpresidio-anonymizer
docker build -t sccatpresidio-anonymizer:2.2.0 .

# Start new containers
cd ../..
docker run -d -p 3000:3000 --name analyzer sccatpresidio-analyzer:2.2.0
docker run -d -p 3001:3000 --name anonymizer sccatpresidio-anonymizer:2.2.0

# Wait for startup
sleep 10

# Test
curl http://localhost:3000/docs
curl http://localhost:3001/docs
```

---

## 📝 Example Files for Testing

### test_data.txt
```
Customer Information:
Name: John Smith
Email: john.smith@example.com
Phone: (555) 123-4567
SSN: 123-45-6789
Credit Card: 4532-1234-5678-9010
```

### Test it:
```bash
curl -X POST http://localhost:3001/process/file \
  -F "file=@test_data.txt" \
  -F "anonymization_strategy=replace"
```

---

## 🎓 Best Practices

1. **Use `/process` for simple workflows** - One call does everything
2. **Use `/analyze` + `/anonymize` for custom control** - More flexibility
3. **Set appropriate score_threshold** - Balance accuracy vs false positives
4. **Choose right anonymization strategy**:
   - `replace` - For readability
   - `mask` - For partial visibility
   - `redact` - For complete removal
   - `hash` - For pseudonymization
5. **Test with Swagger UI first** - Interactive testing before automation

---

## 🔗 Additional Resources

- **Swagger UI**: http://localhost:3000/docs and http://localhost:3001/docs
- **ReDoc**: http://localhost:3000/redoc and http://localhost:3001/redoc
- **Presidio Docs**: https://microsoft.github.io/presidio/
- **API Reference**: See API_REFERENCE.md for more examples

---

**Version:** 2.2.0 Enhanced  
**Last Updated:** 2026-04-28  
**New Features:** File Upload, Combined Processing, Swagger UI
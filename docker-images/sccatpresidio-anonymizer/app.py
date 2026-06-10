"""
Presidio Anonymizer FastAPI Application with Enterprise Features:
- Application Management
- Policy Management
- Real-time Anonymization Controls
- Statistics & Metrics
- Audit Logging
"""
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import RecognizerResult, OperatorConfig
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import deque
import httpx
import os
import uuid
import hashlib

app = FastAPI(
    title="Presidio Anonymizer API",
    description="Enterprise PII Anonymization Service with Policy Management",
    version="2.3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize anonymizer engine
anonymizer = AnonymizerEngine()

# Analyzer service URL (can be configured via environment variable)
# In Docker: use container name, in Kubernetes: use service name
ANALYZER_URL = os.getenv("ANALYZER_URL", "http://analyzer:3000")

# In-memory storage
audit_log = deque(maxlen=1000)
applications = {}  # application_id -> application data
policies = {}  # policy_id -> policy data
anonymization_stats = {
    "total_operations": 0,
    "total_entities_anonymized": 0,
    "operations_by_day": {},
    "entities_by_type": {},
    "operations_by_application": {}
}

def log_audit(endpoint: str, action: str, entities_anonymized: int, anonymization_methods: dict, filename: str = None):
    """Log audit entry"""
    entry = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "anonymizer",
        "endpoint": endpoint,
        "action": action,
        "entities_anonymized": entities_anonymized,
        "anonymization_methods": anonymization_methods,
        "filename": filename
    }
    audit_log.append(entry)
    return entry

class AnonymizeRequest(BaseModel):
    text: str
    analyzer_results: List[Dict]
    operators: Optional[Dict[str, Dict]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "My name is John Doe",
                "analyzer_results": [
                    {"entity_type": "PERSON", "start": 11, "end": 19, "score": 0.85}
                ],
                "operators": {
                    "PERSON": {"type": "replace"}
                }
            }
        }

class AnonymizeResponse(BaseModel):
    text: str
    items: List[Dict]

class ProcessRequest(BaseModel):
    text: str
    language: str = "en"
    score_threshold: float = 0.5
    operators: Optional[Dict[str, Dict]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "Contact John Doe at john@example.com or call 555-1234",
                "language": "en",
                "score_threshold": 0.5,
                "operators": {
                    "EMAIL_ADDRESS": {"type": "mask"},
                    "PHONE_NUMBER": {"type": "redact"}
                }
            }
        }

class ProcessResponse(BaseModel):
    original_text: str
    anonymized_text: str
    entities_detected: List[Dict]
    entities_anonymized: int

class FileProcessResponse(BaseModel):
    filename: str
    original_text: str
    anonymized_text: str
    entities_detected: List[Dict]
    entities_anonymized: int

class AuditEntry(BaseModel):
    id: str
    timestamp: str
    service: str
    endpoint: str
    action: str
    entities_anonymized: int
    anonymization_methods: dict
    filename: Optional[str] = None

class Application(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    anonymization_enabled: bool = True
    created_at: str
    updated_at: str
    
class ApplicationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    anonymization_enabled: bool = True

class ApplicationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    anonymization_enabled: Optional[bool] = None

class MaskingRule(BaseModel):
    entity_type: str
    action: str  # redact, hash, replace, mask, encrypt
    replacement_value: Optional[str] = None

class AnonymizationPolicy(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    application_id: str
    rules: List[MaskingRule]
    enabled: bool = True
    created_at: str
    updated_at: str

class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    application_id: str
    rules: List[MaskingRule]
    enabled: bool = True

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[List[MaskingRule]] = None
    enabled: Optional[bool] = None

class StatsResponse(BaseModel):
    total_operations: int
    total_entities_anonymized: int
    operations_today: int
    entities_today: int
    top_entity_types: List[Dict]
    top_applications: List[Dict]
    operations_by_day: Dict[str, int]

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Presidio Anonymizer",
        "version": "2.3.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "anonymize": "/anonymize",
            "process_text": "/process",
            "process_file": "/process/file",
            "audit_logs": "/audit",
            "audit_stats": "/audit/stats",
            "applications": "/applications",
            "policies": "/policies",
            "statistics": "/stats",
            "docs": "/docs",
            "redoc": "/redoc"
        },
        "features": {
            "application_management": True,
            "policy_management": True,
            "real_time_anonymization": True,
            "statistics_tracking": True,
            "audit_logging": True
        }
    }

@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "presidio-anonymizer",
        "version": "2.2.362",
        "analyzer_url": ANALYZER_URL,
        "audit_entries": len(audit_log)
    }

@app.post("/anonymize", response_model=AnonymizeResponse, tags=["Anonymization"])
async def anonymize(request: AnonymizeRequest):
    """
    Anonymize text based on analyzer results
    
    Supports multiple anonymization strategies:
    - replace: Replace with <ENTITY_TYPE>
    - mask: Replace with asterisks (****)
    - redact: Remove completely
    - hash: SHA-256 hash
    """
    try:
        # Convert analyzer results to RecognizerResult objects
        recognizer_results = [
            RecognizerResult(
                entity_type=r.get("entity_type"),
                start=r.get("start"),
                end=r.get("end"),
                score=r.get("score", 0.0)
            )
            for r in request.analyzer_results
        ]
        
        # Convert operators config if provided
        operators_config = None
        if request.operators:
            operators_config = {
                entity: OperatorConfig(**config)
                for entity, config in request.operators.items()
            }
        
        # Anonymize the text
        result = anonymizer.anonymize(
            text=request.text,
            analyzer_results=recognizer_results,
            operators=operators_config
        )
        
        # Count anonymization methods
        methods = {}
        for item in result.items:
            key = f"{item.entity_type}_{item.operator}"
            methods[key] = methods.get(key, 0) + 1
        
        # Log audit entry
        log_audit(
            endpoint="/anonymize",
            action="text_anonymization",
            entities_anonymized=len(result.items),
            anonymization_methods=methods
        )
        
        return {
            "text": result.text,
            "items": [
                {
                    "start": item.start,
                    "end": item.end,
                    "entity_type": item.entity_type,
                    "text": item.text,
                    "operator": item.operator
                }
                for item in result.items
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anonymization error: {str(e)}")

@app.post("/process", response_model=ProcessResponse, tags=["Combined Processing"])
async def process_text(request: ProcessRequest):
    """
    Complete PII protection pipeline: Analyze + Anonymize in one call
    
    This endpoint:
    1. Sends text to Analyzer service for PII detection
    2. Applies anonymization based on detected entities
    3. Returns both original and anonymized text
    
    Perfect for quick PII protection without multiple API calls!
    """
    try:
        # Step 1: Analyze text
        async with httpx.AsyncClient() as client:
            analyze_response = await client.post(
                f"{ANALYZER_URL}/analyze",
                json={
                    "text": request.text,
                    "language": request.language,
                    "score_threshold": request.score_threshold
                },
                timeout=30.0
            )
            
            if analyze_response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Analyzer service error: {analyze_response.text}"
                )
            
            analyzer_results = analyze_response.json()
        
        # Step 2: Anonymize if entities found
        if not analyzer_results:
            return {
                "original_text": request.text,
                "anonymized_text": request.text,
                "entities_detected": [],
                "entities_anonymized": 0
            }
        
        # Convert to RecognizerResult objects
        recognizer_results = [
            RecognizerResult(
                entity_type=r["entity_type"],
                start=r["start"],
                end=r["end"],
                score=r["score"]
            )
            for r in analyzer_results
        ]
        
        # Convert operators config if provided
        operators_config = None
        if request.operators:
            operators_config = {
                entity: OperatorConfig(**config)
                for entity, config in request.operators.items()
            }
        
        # Anonymize
        result = anonymizer.anonymize(
            text=request.text,
            analyzer_results=recognizer_results,
            operators=operators_config
        )
        
        # Count anonymization methods
        methods = {}
        for item in result.items:
            key = f"{item.entity_type}_{item.operator}"
            methods[key] = methods.get(key, 0) + 1
        
        # Log audit entry
        log_audit(
            endpoint="/process",
            action="combined_processing",
            entities_anonymized=len(result.items),
            anonymization_methods=methods
        )
        
        return {
            "original_text": request.text,
            "anonymized_text": result.text,
            "entities_detected": analyzer_results,
            "entities_anonymized": len(result.items)
        }
        
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to Analyzer service at {ANALYZER_URL}: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

@app.post("/process/file", response_model=FileProcessResponse, tags=["Combined Processing"])
async def process_file(
    file: UploadFile = File(..., description="Text file to process (.txt, .log, .csv, etc.)"),
    language: str = Form("en", description="Language code (en, es, fr, de, etc.)"),
    score_threshold: float = Form(0.5, description="Minimum confidence score (0.0-1.0)"),
    anonymization_strategy: str = Form("replace", description="Strategy: replace, mask, redact, hash")
):
    """
    Complete file processing: Upload file, detect PII, and anonymize
    
    This endpoint:
    1. Reads uploaded text file
    2. Detects PII entities
    3. Anonymizes the content
    4. Returns both original and anonymized versions
    
    Perfect for batch processing of documents!
    """
    try:
        # Read file content
        content = await file.read()
        
        # Try to decode as UTF-8
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="File must be UTF-8 encoded text. Binary files are not supported."
            )
        
        # Step 1: Analyze text
        async with httpx.AsyncClient() as client:
            analyze_response = await client.post(
                f"{ANALYZER_URL}/analyze",
                json={
                    "text": text,
                    "language": language,
                    "score_threshold": score_threshold
                },
                timeout=30.0
            )
            
            if analyze_response.status_code != 200:
                raise HTTPException(
                    status_code=500,
                    detail=f"Analyzer service error: {analyze_response.text}"
                )
            
            analyzer_results = analyze_response.json()
        
        # Step 2: Anonymize if entities found
        if not analyzer_results:
            return {
                "filename": file.filename,
                "original_text": text,
                "anonymized_text": text,
                "entities_detected": [],
                "entities_anonymized": 0
            }
        
        # Convert to RecognizerResult objects
        recognizer_results = [
            RecognizerResult(
                entity_type=r["entity_type"],
                start=r["start"],
                end=r["end"],
                score=r["score"]
            )
            for r in analyzer_results
        ]
        
        # Apply anonymization strategy to all entities
        operators_config = {
            r["entity_type"]: OperatorConfig(operator_name=anonymization_strategy)
            for r in analyzer_results
        }
        
        # Anonymize
        result = anonymizer.anonymize(
            text=text,
            analyzer_results=recognizer_results,
            operators=operators_config
        )
        
        # Count anonymization methods
        methods = {}
        for item in result.items:
            key = f"{item.entity_type}_{item.operator}"
            methods[key] = methods.get(key, 0) + 1
        
        # Log audit entry
        log_audit(
            endpoint="/process/file",
            action="file_processing",
            entities_anonymized=len(result.items),
            anonymization_methods=methods,
            filename=file.filename
        )
        
        return {
            "filename": file.filename,
            "original_text": text,
            "anonymized_text": result.text,
            "entities_detected": analyzer_results,
            "entities_anonymized": len(result.items)
        }
        
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to Analyzer service at {ANALYZER_URL}: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

@app.get("/audit", response_model=List[AuditEntry], tags=["Audit"])
async def get_audit_logs(limit: int = 100, offset: int = 0):
    """
    Get audit log entries
    
    Returns a list of all anonymization operations performed, including:
    - Timestamp
    - Endpoint called
    - Number of entities anonymized
    - Anonymization methods used
    - Filename (for file uploads)
    
    Note: Actual text content is NOT logged for privacy
    """
    logs = list(audit_log)
    logs.reverse()  # Most recent first
    return logs[offset:offset + limit]

@app.get("/audit/stats", tags=["Audit"])
async def get_audit_stats():
    """
    Get audit statistics
    
    Returns aggregated statistics about all anonymization operations:
    - Total operations
    - Total entities anonymized
    - Breakdown by anonymization method
    - Breakdown by endpoint
    """
    if not audit_log:
        return {
            "total_operations": 0,
            "total_entities_anonymized": 0,
            "by_method": {},
            "by_endpoint": {},
            "by_action": {}
        }
    
    total_entities = 0
    method_counts = {}
    endpoint_counts = {}
    action_counts = {}
    
    for entry in audit_log:
        total_entities += entry["entities_anonymized"]
        
        # Count by method
        for method, count in entry["anonymization_methods"].items():
            method_counts[method] = method_counts.get(method, 0) + count
        
        # Count by endpoint
        endpoint = entry["endpoint"]
        endpoint_counts[endpoint] = endpoint_counts.get(endpoint, 0) + 1
        
        # Count by action
        action = entry["action"]
        action_counts[action] = action_counts.get(action, 0) + 1
    
    return {
        "total_operations": len(audit_log),
        "total_entities_anonymized": total_entities,
        "by_method": method_counts,
        "by_endpoint": endpoint_counts,
        "by_action": action_counts
    }

# ============================================================================
# APPLICATION MANAGEMENT ENDPOINTS (Direct Access)
# ============================================================================

@app.get("/applications", response_model=List[Application], tags=["Applications"])
async def list_applications():
    """List all registered applications"""
    return list(applications.values())

@app.post("/applications", response_model=Application, tags=["Applications"])
async def create_application(app_data: ApplicationCreate):
    """Register a new application"""
    app_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"
    
    application = {
        "id": app_id,
        "name": app_data.name,
        "description": app_data.description,
        "anonymization_enabled": app_data.anonymization_enabled,
        "created_at": now,
        "updated_at": now
    }
    
    applications[app_id] = application
    return application

@app.get("/applications/{application_id}", response_model=Application, tags=["Applications"])
async def get_application(application_id: str):
    """Get application details"""
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    return applications[application_id]

@app.put("/applications/{application_id}", response_model=Application, tags=["Applications"])
async def update_application(application_id: str, app_data: ApplicationUpdate):
    """Update application settings"""
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application = applications[application_id]
    
    if app_data.name is not None:
        application["name"] = app_data.name
    if app_data.description is not None:
        application["description"] = app_data.description
    if app_data.anonymization_enabled is not None:
        application["anonymization_enabled"] = app_data.anonymization_enabled
    
    application["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    return application

@app.delete("/applications/{application_id}", tags=["Applications"])
async def delete_application(application_id: str):
    """Delete an application"""
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Delete associated policies
    policy_ids_to_delete = [pid for pid, p in policies.items() if p["application_id"] == application_id]
    for pid in policy_ids_to_delete:
        del policies[pid]
    
    del applications[application_id]
    return {"message": "Application deleted successfully"}

# ============================================================================
# POLICY MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/policies", response_model=List[AnonymizationPolicy], tags=["Policies"])
async def list_policies(application_id: Optional[str] = None):
    """List all anonymization policies, optionally filtered by application"""
    if application_id:
        return [p for p in policies.values() if p["application_id"] == application_id]
    return list(policies.values())

@app.post("/policies", response_model=AnonymizationPolicy, tags=["Policies"])
async def create_policy(policy_data: PolicyCreate):
    """Create a new anonymization policy"""
    # Verify application exists
    if policy_data.application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    
    policy_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"
    
    policy = {
        "id": policy_id,
        "name": policy_data.name,
        "description": policy_data.description,
        "application_id": policy_data.application_id,
        "rules": [rule.dict() for rule in policy_data.rules],
        "enabled": policy_data.enabled,
        "created_at": now,
        "updated_at": now
    }
    
    policies[policy_id] = policy
    return policy

@app.get("/policies/{policy_id}", response_model=AnonymizationPolicy, tags=["Policies"])
async def get_policy(policy_id: str):
    """Get policy details"""
    if policy_id not in policies:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policies[policy_id]

@app.put("/policies/{policy_id}", response_model=AnonymizationPolicy, tags=["Policies"])
async def update_policy(policy_id: str, policy_data: PolicyUpdate):
    """Update a policy"""
    if policy_id not in policies:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    policy = policies[policy_id]
    
    if policy_data.name is not None:
        policy["name"] = policy_data.name
    if policy_data.description is not None:
        policy["description"] = policy_data.description
    if policy_data.rules is not None:
        policy["rules"] = [rule.dict() for rule in policy_data.rules]
    if policy_data.enabled is not None:
        policy["enabled"] = policy_data.enabled
    
    policy["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    return policy

@app.delete("/policies/{policy_id}", tags=["Policies"])
async def delete_policy(policy_id: str):
    """Delete a policy"""
    if policy_id not in policies:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    del policies[policy_id]
    return {"message": "Policy deleted successfully"}

@app.post("/policies/{policy_id}/toggle", response_model=AnonymizationPolicy, tags=["Policies"])
async def toggle_policy(policy_id: str):
    """Toggle policy enabled/disabled status"""
    if policy_id not in policies:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    policy = policies[policy_id]
    policy["enabled"] = not policy["enabled"]
    policy["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    return policy

# ============================================================================
# STATISTICS ENDPOINTS
# ============================================================================

@app.get("/stats", response_model=StatsResponse, tags=["Statistics"])
async def get_statistics():
    """Get anonymization statistics and metrics"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Calculate today's stats
    operations_today = anonymization_stats["operations_by_day"].get(today, 0)
    
    # Calculate entities today (approximate from operations)
    entities_today = int(operations_today * (anonymization_stats["total_entities_anonymized"] / max(anonymization_stats["total_operations"], 1)))
    
    # Top entity types
    top_entity_types = [
        {"entity_type": k, "count": v}
        for k, v in sorted(anonymization_stats["entities_by_type"].items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Top applications
    top_applications = [
        {"application_id": k, "count": v, "name": applications.get(k, {}).get("name", "Unknown")}
        for k, v in sorted(anonymization_stats["operations_by_application"].items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Last 30 days operations
    operations_by_day = {}
    for i in range(30):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        operations_by_day[date] = anonymization_stats["operations_by_day"].get(date, 0)
    
    return {
        "total_operations": anonymization_stats["total_operations"],
        "total_entities_anonymized": anonymization_stats["total_entities_anonymized"],
        "operations_today": operations_today,
        "entities_today": entities_today,
        "top_entity_types": top_entity_types,
        "top_applications": top_applications,
        "operations_by_day": operations_by_day
    }

# ============================================================================
# POLICY API ENDPOINTS (Frontend Compatible Routes)
# ============================================================================

@app.get("/policies/applications", response_model=List[Application], tags=["Policy API"])
async def policy_list_applications():
    """List all applications (frontend compatible route)"""
    return list(applications.values())

@app.get("/policies/applications/{application_id}", response_model=Application, tags=["Policy API"])
async def policy_get_application(application_id: str):
    """Get application (frontend compatible route)"""
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    return applications[application_id]

@app.post("/policies/applications", response_model=Application, tags=["Policy API"])
async def policy_create_application(app_data: ApplicationCreate):
    """Create application (frontend compatible route)"""
    return await create_application(app_data)

@app.put("/policies/applications/{application_id}", response_model=Application, tags=["Policy API"])
async def policy_update_application(application_id: str, app_data: ApplicationUpdate):
    """Update application (frontend compatible route)"""
    return await update_application(application_id, app_data)

@app.delete("/policies/applications/{application_id}", tags=["Policy API"])
async def policy_delete_application(application_id: str):
    """Delete application (frontend compatible route)"""
    return await delete_application(application_id)

@app.patch("/policies/applications/{application_id}/toggle", response_model=Application, tags=["Policy API"])
async def policy_toggle_application(application_id: str, payload: dict):
    """Toggle application anonymization (frontend compatible route)"""
    if application_id not in applications:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application = applications[application_id]
    application["anonymization_enabled"] = payload.get("enabled", not application["anonymization_enabled"])
    application["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    return application

@app.patch("/policies/{policy_id}/toggle", response_model=AnonymizationPolicy, tags=["Policy API"])
async def policy_toggle_with_payload(policy_id: str, payload: dict):
    """Toggle policy with payload (frontend compatible route)"""
    if policy_id not in policies:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    policy = policies[policy_id]
    policy["enabled"] = payload.get("enabled", not policy["enabled"])
    policy["updated_at"] = datetime.utcnow().isoformat() + "Z"
    
    return policy

@app.get("/policies/stats", tags=["Policy API"])
async def policy_get_stats():
    """Get policy statistics (frontend compatible route)"""
    return await get_statistics()

@app.post("/policies/{policy_id}/test", tags=["Policy API"])
async def policy_test(policy_id: str, payload: dict):
    """Test a policy against sample text"""
    if policy_id not in policies:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    policy = policies[policy_id]
    test_text = payload.get("text", "")
    
    if not test_text:
        raise HTTPException(status_code=400, detail="Test text is required")
    
    # Check if application has anonymization enabled
    app_id = policy["application_id"]
    if app_id in applications and not applications[app_id]["anonymization_enabled"]:
        return {
            "original_text": test_text,
            "anonymized_text": test_text,
            "entities_detected": [],
            "message": "Anonymization disabled for this application"
        }
    
    # Analyze text first
    try:
        async with httpx.AsyncClient() as client:
            analyze_response = await client.post(
                f"{ANALYZER_URL}/analyze",
                json={
                    "text": test_text,
                    "language": "en",
                    "score_threshold": 0.5
                },
                timeout=30.0
            )
            
            if analyze_response.status_code != 200:
                raise HTTPException(status_code=500, detail="Analyzer service error")
            
            analyzer_results = analyze_response.json()
        
        if not analyzer_results:
            return {
                "original_text": test_text,
                "anonymized_text": test_text,
                "entities_detected": [],
                "message": "No PII detected"
            }
        
        # Apply policy rules
        result = apply_policy_rules(test_text, analyzer_results, policy)
        
        return {
            "original_text": test_text,
            "anonymized_text": result["text"],
            "entities_detected": analyzer_results,
            "anonymized_items": result["items"],
            "policy_applied": policy["name"]
        }
        
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Cannot connect to Analyzer service: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test error: {str(e)}")

# Helper function for applying policy rules
def apply_policy_rules(text: str, analyzer_results: List[Dict], policy: Dict) -> Dict:
    """Apply policy rules to anonymize text using Presidio"""
    if not policy or not policy.get("enabled"):
        return {"text": text, "items": []}
    
    # Convert analyzer results to RecognizerResult objects
    recognizer_results = [
        RecognizerResult(
            entity_type=r.get("entity_type"),
            start=r.get("start"),
            end=r.get("end"),
            score=r.get("score", 0.0)
        )
        for r in analyzer_results
    ]
    
    # Build operators config from policy rules
    operators_config = {}
    for rule in policy.get("rules", []):
        entity_type = rule["entity_type"]
        action = rule["action"]
        
        # Map action to Presidio operator
        if action == "redact":
            operators_config[entity_type] = OperatorConfig(operator_name="redact")
        elif action == "hash":
            operators_config[entity_type] = OperatorConfig(operator_name="hash")
        elif action == "mask":
            operators_config[entity_type] = OperatorConfig(operator_name="mask", params={"masking_char": "*", "chars_to_mask": 100, "from_end": False})
        elif action == "replace":
            replacement = rule.get("replacement_value", f"<{entity_type}>")
            operators_config[entity_type] = OperatorConfig(operator_name="replace", params={"new_value": replacement})
        elif action == "encrypt":
            # Use hash as encryption substitute
            operators_config[entity_type] = OperatorConfig(operator_name="hash")
        else:
            # Default to replace
            operators_config[entity_type] = OperatorConfig(operator_name="replace")
    
    # Anonymize using Presidio
    result = anonymizer.anonymize(
        text=text,
        analyzer_results=recognizer_results,
        operators=operators_config
    )
    
    return {
        "text": result.text,
        "items": [
            {
                "start": item.start,
                "end": item.end,
                "entity_type": item.entity_type,
                "text": item.text,
                "operator": item.operator
            }
            for item in result.items
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)

# Made with Bob

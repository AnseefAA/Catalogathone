"""
Presidio Analyzer FastAPI Application with File Upload Support and Audit Logging
"""
from presidio_analyzer import AnalyzerEngine
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from collections import deque
import uuid

app = FastAPI(
    title="Presidio Analyzer API",
    description="PII Detection Service - Detects sensitive information in text and files",
    version="2.2.362",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Initialize analyzer engine
analyzer = AnalyzerEngine()

# In-memory audit log (last 1000 entries)
audit_log = deque(maxlen=1000)

def log_audit(endpoint: str, action: str, entities_found: int, entity_types: dict, filename: str = None):
    """Log audit entry"""
    entry = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "analyzer",
        "endpoint": endpoint,
        "action": action,
        "entities_found": entities_found,
        "entity_types": entity_types,
        "filename": filename
    }
    audit_log.append(entry)
    return entry

class AnalyzeRequest(BaseModel):
    text: str
    language: str = "en"
    entities: Optional[List[str]] = None
    score_threshold: Optional[float] = 0.5
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "My name is John Doe and my email is john@example.com",
                "language": "en",
                "score_threshold": 0.5
            }
        }

class AnalyzeResponse(BaseModel):
    entity_type: str
    start: int
    end: int
    score: float

class FileAnalyzeResponse(BaseModel):
    filename: str
    text: str
    entities: List[AnalyzeResponse]
    entity_count: int

class AuditEntry(BaseModel):
    id: str
    timestamp: str
    service: str
    endpoint: str
    action: str
    entities_found: int
    entity_types: dict
    filename: Optional[str] = None

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Presidio Analyzer",
        "version": "2.2.362",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "analyze_text": "/analyze",
            "analyze_file": "/analyze/file",
            "audit_logs": "/audit",
            "audit_stats": "/audit/stats",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "presidio-analyzer",
        "version": "2.2.362",
        "audit_entries": len(audit_log)
    }

@app.post("/analyze", response_model=List[AnalyzeResponse], tags=["Analysis"])
async def analyze(request: AnalyzeRequest):
    """
    Analyze text for PII entities
    
    Detects sensitive information such as:
    - Person names
    - Email addresses
    - Phone numbers
    - Credit card numbers
    - Social security numbers
    - And more...
    """
    try:
        results = analyzer.analyze(
            text=request.text,
            language=request.language,
            entities=request.entities,
            score_threshold=request.score_threshold
        )
        
        # Count entity types
        entity_types = {}
        for r in results:
            entity_types[r.entity_type] = entity_types.get(r.entity_type, 0) + 1
        
        # Log audit entry
        log_audit(
            endpoint="/analyze",
            action="text_analysis",
            entities_found=len(results),
            entity_types=entity_types
        )
        
        return [
            {
                "entity_type": r.entity_type,
                "start": r.start,
                "end": r.end,
                "score": r.score
            }
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.post("/analyze/file", response_model=FileAnalyzeResponse, tags=["Analysis"])
async def analyze_file(
    file: UploadFile = File(..., description="Text file to analyze (.txt, .log, .csv, etc.)"),
    language: str = Form("en", description="Language code (en, es, fr, de, etc.)"),
    score_threshold: float = Form(0.5, description="Minimum confidence score (0.0-1.0)")
):
    """
    Analyze uploaded file for PII entities
    
    Supports text-based files:
    - .txt files
    - .log files
    - .csv files
    - .json files
    - Any UTF-8 encoded text file
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
        
        # Analyze the text
        results = analyzer.analyze(
            text=text,
            language=language,
            score_threshold=score_threshold
        )
        
        entities = [
            {
                "entity_type": r.entity_type,
                "start": r.start,
                "end": r.end,
                "score": r.score
            }
            for r in results
        ]
        
        # Count entity types
        entity_types = {}
        for r in results:
            entity_types[r.entity_type] = entity_types.get(r.entity_type, 0) + 1
        
        # Log audit entry
        log_audit(
            endpoint="/analyze/file",
            action="file_analysis",
            entities_found=len(results),
            entity_types=entity_types,
            filename=file.filename
        )
        
        return {
            "filename": file.filename,
            "text": text,
            "entities": entities,
            "entity_count": len(entities)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File analysis error: {str(e)}")

@app.get("/audit", response_model=List[AuditEntry], tags=["Audit"])
async def get_audit_logs(limit: int = 100, offset: int = 0):
    """
    Get audit log entries
    
    Returns a list of all analysis operations performed, including:
    - Timestamp
    - Endpoint called
    - Number of entities found
    - Entity types detected
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
    
    Returns aggregated statistics about all analysis operations:
    - Total operations
    - Total entities found
    - Breakdown by entity type
    - Breakdown by endpoint
    """
    if not audit_log:
        return {
            "total_operations": 0,
            "total_entities_found": 0,
            "by_entity_type": {},
            "by_endpoint": {},
            "by_action": {}
        }
    
    total_entities = 0
    entity_type_counts = {}
    endpoint_counts = {}
    action_counts = {}
    
    for entry in audit_log:
        total_entities += entry["entities_found"]
        
        # Count by entity type
        for entity_type, count in entry["entity_types"].items():
            entity_type_counts[entity_type] = entity_type_counts.get(entity_type, 0) + count
        
        # Count by endpoint
        endpoint = entry["endpoint"]
        endpoint_counts[endpoint] = endpoint_counts.get(endpoint, 0) + 1
        
        # Count by action
        action = entry["action"]
        action_counts[action] = action_counts.get(action, 0) + 1
    
    return {
        "total_operations": len(audit_log),
        "total_entities_found": total_entities,
        "by_entity_type": entity_type_counts,
        "by_endpoint": endpoint_counts,
        "by_action": action_counts
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)

# Made with Bob

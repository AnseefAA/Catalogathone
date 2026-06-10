"""
Presidio UI - Web Interface for PII Detection and Anonymization
Built with Flask and IBM-inspired design
"""
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import httpx
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Service URLs (configurable via environment variables)
ANALYZER_URL = os.getenv("ANALYZER_URL", "http://localhost:3000")
ANONYMIZER_URL = os.getenv("ANONYMIZER_URL", "http://localhost:3001")


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Proxy to analyzer service"""
    try:
        data = request.get_json()
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{ANALYZER_URL}/analyze",
                json=data
            )
            
            return jsonify(response.json()), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/anonymize', methods=['POST'])
def anonymize():
    """Proxy to anonymizer service"""
    try:
        data = request.get_json()
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{ANONYMIZER_URL}/anonymize",
                json=data
            )
            
            return jsonify(response.json()), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/process', methods=['POST'])
def process():
    """Proxy to combined processing endpoint"""
    try:
        data = request.get_json()
        
        # Build the request payload
        payload = {
            "text": data.get("text"),
            "language": data.get("language", "en")
        }
        
        # Add anonymization strategy if provided
        if data.get("anonymization_strategy"):
            payload["anonymization_strategy"] = data["anonymization_strategy"]
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{ANONYMIZER_URL}/process",
                json=payload
            )
            
            return jsonify(response.json()), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyzer/process/file', methods=['POST'])
def analyze_file():
    """Proxy file upload to analyzer service"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        language = request.form.get('language', 'en')
        
        files = {'file': (file.filename, file.stream, file.content_type)}
        data = {'language': language}
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{ANALYZER_URL}/analyze/file",
                files=files,
                data=data
            )
            
            return jsonify(response.json()), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/anonymizer/process/file', methods=['POST'])
def anonymize_file():
    """Proxy file upload to anonymizer service"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        language = request.form.get('language', 'en')
        strategy = request.form.get('anonymization_strategy', 'replace')
        
        files = {'file': (file.filename, file.stream, file.content_type)}
        data = {
            'language': language,
            'anonymization_strategy': strategy
        }
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{ANONYMIZER_URL}/process/file",
                files=files,
                data=data
            )
            
            return jsonify(response.json()), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/audit/analyzer', methods=['GET'])
def audit_analyzer():
    """Get analyzer audit logs"""
    try:
        limit = request.args.get('limit', 100)
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{ANALYZER_URL}/audit?limit={limit}"
            )
            
            return jsonify(response.json()), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/audit/anonymizer', methods=['GET'])
def audit_anonymizer():
    """Get anonymizer audit logs"""
    try:
        limit = request.args.get('limit', 100)
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{ANONYMIZER_URL}/audit?limit={limit}"
            )
            
            return jsonify(response.json()), response.status_code
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/audit/stats', methods=['GET'])
def audit_stats():
    """Get combined audit statistics"""
    try:
        with httpx.Client(timeout=30.0) as client:
            analyzer_stats = client.get(f"{ANALYZER_URL}/audit/stats")
            anonymizer_stats = client.get(f"{ANONYMIZER_URL}/audit/stats")
            
            return jsonify({
                "analyzer": analyzer_stats.json(),
                "anonymizer": anonymizer_stats.json()
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# In-memory storage for policies (replace with database in production)
applications_db = [
    {
        "id": "app-1",
        "name": "Customer Portal",
        "description": "Main customer-facing application",
        "environment": "production",
        "policies_count": 3,
        "anonymization_enabled": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": "app-2",
        "name": "Analytics Service",
        "description": "Data analytics and reporting",
        "environment": "production",
        "policies_count": 2,
        "anonymization_enabled": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": "app-3",
        "name": "Admin Dashboard",
        "description": "Internal admin tools",
        "environment": "staging",
        "policies_count": 1,
        "anonymization_enabled": False,
        "created_at": "2024-01-01T00:00:00Z"
    }
]

policies_db = [
    {
        "id": "policy-1",
        "name": "PII Protection Policy",
        "description": "Protect all PII data in customer logs",
        "application_id": "app-1",
        "application_name": "Customer Portal",
        "enabled": True,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "rules": [
            {
                "id": "rule-1",
                "entity_type": "EMAIL_ADDRESS",
                "operator_type": "hash",
                "operator_config": {"type": "hash"},
                "enabled": True,
                "priority": 1
            },
            {
                "id": "rule-2",
                "entity_type": "PHONE_NUMBER",
                "operator_type": "mask",
                "operator_config": {"type": "mask", "masking_char": "*", "chars_to_mask": 4, "from_end": True},
                "enabled": True,
                "priority": 2
            },
            {
                "id": "rule-3",
                "entity_type": "CREDIT_CARD",
                "operator_type": "redact",
                "operator_config": {"type": "redact"},
                "enabled": True,
                "priority": 3
            }
        ]
    },
    {
        "id": "policy-2",
        "name": "Analytics Data Policy",
        "description": "Hash sensitive data before analytics processing",
        "application_id": "app-2",
        "application_name": "Analytics Service",
        "enabled": True,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "rules": [
            {
                "id": "rule-4",
                "entity_type": "EMAIL_ADDRESS",
                "operator_type": "hash",
                "operator_config": {"type": "hash"},
                "enabled": True,
                "priority": 1
            },
            {
                "id": "rule-5",
                "entity_type": "US_SSN",
                "operator_type": "redact",
                "operator_config": {"type": "redact"},
                "enabled": True,
                "priority": 2
            }
        ]
    },
    {
        "id": "policy-3",
        "name": "Admin Logs Policy",
        "description": "Mask PAN data in admin logs",
        "application_id": "app-3",
        "application_name": "Admin Dashboard",
        "enabled": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "rules": [
            {
                "id": "rule-6",
                "entity_type": "CREDIT_CARD",
                "operator_type": "mask",
                "operator_config": {"type": "mask", "masking_char": "X", "chars_to_mask": 12, "from_end": False},
                "enabled": True,
                "priority": 1
            }
        ]
    }
]

# Policy Management API Endpoints

@app.route('/api/policies/applications', methods=['GET'])
def list_applications():
    """List all applications"""
    return jsonify(applications_db), 200

@app.route('/api/policies/applications/<app_id>', methods=['GET'])
def get_application(app_id):
    """Get a specific application"""
    app = next((a for a in applications_db if a['id'] == app_id), None)
    if app:
        return jsonify(app), 200
    return jsonify({"error": "Application not found"}), 404

@app.route('/api/policies/applications/<app_id>/toggle', methods=['PATCH'])
def toggle_application(app_id):
    """Toggle anonymization for an application"""
    data = request.get_json()
    app = next((a for a in applications_db if a['id'] == app_id), None)
    if app:
        app['anonymization_enabled'] = data.get('enabled', not app['anonymization_enabled'])
        return jsonify(app), 200
    return jsonify({"error": "Application not found"}), 404

@app.route('/api/policies', methods=['GET'])
def list_policies():
    """List all policies or filter by application"""
    application_id = request.args.get('application_id')
    if application_id:
        filtered = [p for p in policies_db if p['application_id'] == application_id]
        return jsonify(filtered), 200
    return jsonify(policies_db), 200

@app.route('/api/policies/<policy_id>', methods=['GET'])
def get_policy(policy_id):
    """Get a specific policy"""
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if policy:
        return jsonify(policy), 200
    return jsonify({"error": "Policy not found"}), 404

@app.route('/api/policies/<policy_id>/toggle', methods=['PATCH'])
def toggle_policy(policy_id):
    """Toggle a policy on/off"""
    data = request.get_json()
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if policy:
        policy['enabled'] = data.get('enabled', not policy['enabled'])
        return jsonify(policy), 200
    return jsonify({"error": "Policy not found"}), 404

@app.route('/api/policies/<policy_id>', methods=['DELETE'])
def delete_policy(policy_id):
    """Delete a policy"""
    global policies_db
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if policy:
        policies_db = [p for p in policies_db if p['id'] != policy_id]
        # Update application policy count
        app = next((a for a in applications_db if a['id'] == policy['application_id']), None)
        if app:
            app['policies_count'] -= 1
        return jsonify({"message": "Policy deleted"}), 200
    return jsonify({"error": "Policy not found"}), 404

@app.route('/api/policies/<policy_id>/rules/<rule_id>/toggle', methods=['PATCH'])
def toggle_rule(policy_id, rule_id):
    """Toggle a rule on/off"""
    data = request.get_json()
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if policy:
        rule = next((r for r in policy['rules'] if r['id'] == rule_id), None)
        if rule:
            rule['enabled'] = data.get('enabled', not rule['enabled'])
            return jsonify(rule), 200
        return jsonify({"error": "Rule not found"}), 404
    return jsonify({"error": "Policy not found"}), 404

@app.route('/api/policies/stats', methods=['GET'])
def get_policy_stats():
    """Get policy statistics"""
    active_policies = sum(1 for p in policies_db if p['enabled'])
    return jsonify({
        "total_policies": len(policies_db),
        "active_policies": active_policies,
        "total_applications": len(applications_db),
        "entities_processed_today": 15847,
        "entities_anonymized_today": 12456
    }), 200

@app.route('/api/policies/<policy_id>/test', methods=['POST'])
def test_policy(policy_id):
    """Test a policy with sample text"""
    data = request.get_json()
    text = data.get('text', '')
    
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if not policy:
        return jsonify({"error": "Policy not found"}), 404
    
    # Simulate anonymization (in production, call actual anonymizer)
    anonymized_text = text
    entities_detected = []
    
    # Simple simulation - replace common patterns
    if 'email' in text.lower() or '@' in text:
        anonymized_text = anonymized_text.replace('@', '[HASHED]')
        entities_detected.append({"type": "EMAIL_ADDRESS", "start": 0, "end": 10})
    
    if any(char.isdigit() for char in text):
        import re
        anonymized_text = re.sub(r'\d', '*', anonymized_text)
        entities_detected.append({"type": "PHONE_NUMBER", "start": 0, "end": 10})
    
    return jsonify({
        "original_text": text,
        "anonymized_text": anonymized_text,
        "entities_detected": entities_detected,
        "policy_applied": policy['name']
    }), 200

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "presidio-ui",
        "version": "1.0.0",
        "analyzer_url": ANALYZER_URL,
        "anonymizer_url": ANONYMIZER_URL
    })

# This catch-all route MUST be last - it serves the React app for non-API routes
# All API routes above will be matched first
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app_catchall(path):
    """Serve React app for all non-API routes - MUST BE LAST ROUTE"""
    # API routes are already handled above, so this won't interfere
    # Serve static files if they exist
    if path and os.path.exists(os.path.join(app.static_folder or 'static', path)):
        return app.send_static_file(path)
    
    # Otherwise serve index.html for React routing
    try:
        return render_template('index.html')
    except:
        return jsonify({"error": "Frontend not built. Run 'npm run build' in presidio-enterprise-ui"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)

# Made with Bob

"""
Standalone API server for policy management
Run this separately from the UI server for development
Supports both mock data mode and proxy mode to anonymizer service
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# Configuration
USE_ANONYMIZER_SERVICE = os.getenv('USE_ANONYMIZER_SERVICE', 'false').lower() == 'true'
ANONYMIZER_URL = os.getenv('ANONYMIZER_URL', 'http://localhost:3002')

def proxy_to_anonymizer(path, method='GET', data=None, params=None):
    """Proxy request to anonymizer service"""
    url = f"{ANONYMIZER_URL}{path}"
    try:
        if method == 'GET':
            response = requests.get(url, params=params, timeout=30)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=30)
        elif method == 'PUT':
            response = requests.put(url, json=data, timeout=30)
        elif method == 'PATCH':
            response = requests.patch(url, json=data, timeout=30)
        elif method == 'DELETE':
            response = requests.delete(url, timeout=30)
        else:
            return jsonify({"error": "Unsupported method"}), 400
        
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": f"Anonymizer service error: {str(e)}"}), 503

# In-memory storage
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

@app.route('/api/policies/applications', methods=['GET', 'POST'])
def list_or_create_applications():
    """List all applications or create new one"""
    if USE_ANONYMIZER_SERVICE:
        if request.method == 'GET':
            return proxy_to_anonymizer('/policies/applications', 'GET')
        else:
            return proxy_to_anonymizer('/policies/applications', 'POST', request.get_json())
    
    # Mock mode
    if request.method == 'GET':
        return jsonify(applications_db), 200
    else:
        # Create new application (mock)
        data = request.get_json()
        new_app = {
            "id": f"app-{len(applications_db) + 1}",
            "name": data.get('name', 'New Application'),
            "description": data.get('description', ''),
            "environment": "development",
            "policies_count": 0,
            "anonymization_enabled": data.get('anonymization_enabled', True),
            "created_at": "2024-01-01T00:00:00Z"
        }
        applications_db.append(new_app)
        return jsonify(new_app), 201

@app.route('/api/policies/applications/<app_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_application(app_id):
    """Get, update, or delete a specific application"""
    if USE_ANONYMIZER_SERVICE:
        if request.method == 'GET':
            return proxy_to_anonymizer(f'/policies/applications/{app_id}', 'GET')
        elif request.method == 'PUT':
            return proxy_to_anonymizer(f'/policies/applications/{app_id}', 'PUT', request.get_json())
        else:  # DELETE
            return proxy_to_anonymizer(f'/policies/applications/{app_id}', 'DELETE')
    
    # Mock mode
    app = next((a for a in applications_db if a['id'] == app_id), None)
    if not app:
        return jsonify({"error": "Application not found"}), 404
    
    if request.method == 'GET':
        return jsonify(app), 200
    elif request.method == 'PUT':
        data = request.get_json()
        app.update({
            "name": data.get('name', app['name']),
            "description": data.get('description', app['description']),
            "anonymization_enabled": data.get('anonymization_enabled', app['anonymization_enabled'])
        })
        return jsonify(app), 200
    else:  # DELETE
        applications_db.remove(app)
        return jsonify({"message": "Application deleted"}), 200

@app.route('/api/policies/applications/<app_id>/toggle', methods=['PATCH'])
def toggle_application(app_id):
    """Toggle anonymization for an application"""
    if USE_ANONYMIZER_SERVICE:
        return proxy_to_anonymizer(f'/policies/applications/{app_id}/toggle', 'PATCH', request.get_json())
    
    # Mock mode
    data = request.get_json()
    app = next((a for a in applications_db if a['id'] == app_id), None)
    if app:
        app['anonymization_enabled'] = data.get('enabled', not app['anonymization_enabled'])
        return jsonify(app), 200
    return jsonify({"error": "Application not found"}), 404

@app.route('/api/policies', methods=['GET', 'POST'])
def list_or_create_policies():
    """List all policies or create new one"""
    if USE_ANONYMIZER_SERVICE:
        if request.method == 'GET':
            return proxy_to_anonymizer('/policies', 'GET', params=request.args)
        else:
            return proxy_to_anonymizer('/policies', 'POST', request.get_json())
    
    # Mock mode
    if request.method == 'GET':
        application_id = request.args.get('application_id')
        if application_id:
            filtered = [p for p in policies_db if p['application_id'] == application_id]
            return jsonify(filtered), 200
        return jsonify(policies_db), 200
    else:
        # Create new policy (mock)
        data = request.get_json()
        new_policy = {
            "id": f"policy-{len(policies_db) + 1}",
            "name": data.get('name', 'New Policy'),
            "description": data.get('description', ''),
            "application_id": data.get('application_id'),
            "enabled": data.get('enabled', True),
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z",
            "rules": data.get('rules', [])
        }
        policies_db.append(new_policy)
        return jsonify(new_policy), 201

@app.route('/api/policies/<policy_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_policy(policy_id):
    """Get, update, or delete a specific policy"""
    if USE_ANONYMIZER_SERVICE:
        if request.method == 'GET':
            return proxy_to_anonymizer(f'/policies/{policy_id}', 'GET')
        elif request.method == 'PUT':
            return proxy_to_anonymizer(f'/policies/{policy_id}', 'PUT', request.get_json())
        else:  # DELETE
            return proxy_to_anonymizer(f'/policies/{policy_id}', 'DELETE')
    
    # Mock mode
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if not policy:
        return jsonify({"error": "Policy not found"}), 404
    
    if request.method == 'GET':
        return jsonify(policy), 200
    elif request.method == 'PUT':
        data = request.get_json()
        policy.update({
            "name": data.get('name', policy['name']),
            "description": data.get('description', policy['description']),
            "enabled": data.get('enabled', policy['enabled']),
            "rules": data.get('rules', policy['rules'])
        })
        return jsonify(policy), 200
    else:  # DELETE
        global policies_db
        policies_db = [p for p in policies_db if p['id'] != policy_id]
        app = next((a for a in applications_db if a['id'] == policy['application_id']), None)
        if app:
            app['policies_count'] -= 1
        return jsonify({"message": "Policy deleted"}), 200

@app.route('/api/policies/<policy_id>/toggle', methods=['PATCH'])
def toggle_policy(policy_id):
    """Toggle a policy on/off"""
    if USE_ANONYMIZER_SERVICE:
        return proxy_to_anonymizer(f'/policies/{policy_id}/toggle', 'PATCH', request.get_json())
    
    # Mock mode
    data = request.get_json()
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if policy:
        policy['enabled'] = data.get('enabled', not policy['enabled'])
        return jsonify(policy), 200
    return jsonify({"error": "Policy not found"}), 404

@app.route('/api/policies/<policy_id>/test', methods=['POST'])
def test_policy(policy_id):
    """Test a policy against sample text"""
    if USE_ANONYMIZER_SERVICE:
        return proxy_to_anonymizer(f'/policies/{policy_id}/test', 'POST', request.get_json())
    
    # Mock mode - simple response
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if not policy:
        return jsonify({"error": "Policy not found"}), 404
    
    data = request.get_json()
    test_text = data.get('text', '')
    
    return jsonify({
        "original_text": test_text,
        "anonymized_text": test_text.replace("test@example.com", "***@***.***"),
        "entities_detected": [{"entity_type": "EMAIL_ADDRESS", "start": 0, "end": 16, "score": 0.95}],
        "policy_applied": policy['name']
    }), 200

@app.route('/api/policies/stats', methods=['GET'])
def get_policy_stats():
    """Get policy statistics"""
    if USE_ANONYMIZER_SERVICE:
        return proxy_to_anonymizer('/policies/stats', 'GET')
    
    # Mock mode
    return jsonify({
        "total_operations": 1250,
        "total_entities_anonymized": 3420,
        "operations_today": 45,
        "entities_today": 120,
        "top_entity_types": [
            {"entity_type": "EMAIL_ADDRESS", "count": 850},
            {"entity_type": "PHONE_NUMBER", "count": 620},
            {"entity_type": "CREDIT_CARD", "count": 450}
        ],
        "top_applications": [
            {"application_id": "app-1", "count": 650, "name": "Customer Portal"},
            {"application_id": "app-2", "count": 400, "name": "Analytics Service"}
        ],
        "operations_by_day": {}
    }), 200

@app.route('/api/policies/<policy_id>/rules/<rule_id>/toggle', methods=['PATCH'])
def toggle_rule(policy_id, rule_id):
    """Toggle a rule on/off"""
    if USE_ANONYMIZER_SERVICE:
        return proxy_to_anonymizer(f'/policies/{policy_id}/rules/{rule_id}/toggle', 'PATCH', request.get_json())
    
    # Mock mode
    data = request.get_json()
    policy = next((p for p in policies_db if p['id'] == policy_id), None)
    if policy:
        rule = next((r for r in policy['rules'] if r['id'] == rule_id), None)
        if rule:
            rule['enabled'] = data.get('enabled', not rule['enabled'])
            return jsonify(rule), 200
        return jsonify({"error": "Rule not found"}), 404
    return jsonify({"error": "Policy not found"}), 404
    
    return jsonify({
        "original_text": text,
        "anonymized_text": anonymized_text,
        "entities_detected": entities_detected,
        "policy_applied": policy['name']
    }), 200

@app.route('/health')
def health():
    """Health check"""
    return jsonify({"status": "healthy", "service": "policy-api"}), 200

if __name__ == '__main__':
    print("=" * 60)
    print("Policy Management API Server")
    print("=" * 60)
    print("Running on: http://localhost:8080")
    print("\nAvailable endpoints:")
    print("  GET    /api/policies/applications")
    print("  GET    /api/policies")
    print("  GET    /api/policies/stats")
    print("  PATCH  /api/policies/applications/<id>/toggle")
    print("  PATCH  /api/policies/<id>/toggle")
    print("  DELETE /api/policies/<id>")
    print("=" * 60)
    app.run(host='0.0.0.0', port=8080, debug=True)

# Made with Bob

# Audit & Compliance API Endpoints

# Mock audit data
audit_logs_db = []
pii_detection_logs_db = []
anonymization_logs_db = []

# Generate some mock audit logs
import random
from datetime import datetime, timedelta

def generate_mock_audit_logs():
    global audit_logs_db
    operations = ['analyze', 'anonymize', 'process', 'policy_change']
    users = ['john.doe@company.com', 'jane.smith@company.com', 'bob.wilson@company.com', 'admin@company.com']
    entity_types_list = [
        ['EMAIL_ADDRESS', 'PHONE_NUMBER'],
        ['CREDIT_CARD', 'US_SSN'],
        ['EMAIL_ADDRESS'],
        ['PHONE_NUMBER', 'CREDIT_CARD', 'EMAIL_ADDRESS'],
    ]
    
    for i in range(100):
        timestamp = datetime.now() - timedelta(hours=random.randint(0, 720))
        operation = random.choice(operations)
        entity_types = random.choice(entity_types_list)
        pii_count = random.randint(1, 50)
        
        audit_logs_db.append({
            'id': f'log-{i+1}',
            'timestamp': timestamp.isoformat(),
            'instance_id': 'inst-1',
            'application_id': random.choice(['app-1', 'app-2', 'app-3']),
            'application_name': random.choice(['Customer Portal', 'Analytics Service', 'Admin Dashboard']),
            'operation': operation,
            'user': random.choice(users),
            'user_role': random.choice(['admin', 'operator', 'viewer']),
            'entity_types': entity_types,
            'entities_count': pii_count,
            'pii_detected': pii_count,
            'pii_anonymized': pii_count if operation in ['anonymize', 'process'] else 0,
            'success': random.random() > 0.05,
            'duration_ms': random.randint(50, 1000),
            'source_ip': f'192.168.1.{random.randint(100, 200)}',
            'metadata': {},
        })

generate_mock_audit_logs()

@app.route('/api/audit/logs', methods=['GET'])
def get_audit_logs():
    """Get audit logs with pagination and filtering"""
    page = int(request.args.get('page', 1))
    page_size = int(request.args.get('page_size', 50))
    
    # Apply filters
    filtered_logs = audit_logs_db.copy()
    
    if request.args.get('operation'):
        filtered_logs = [log for log in filtered_logs if log['operation'] == request.args.get('operation')]
    
    if request.args.get('success'):
        success_filter = request.args.get('success').lower() == 'true'
        filtered_logs = [log for log in filtered_logs if log['success'] == success_filter]
    
    # Sort by timestamp descending
    filtered_logs.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Paginate
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_logs = filtered_logs[start_idx:end_idx]
    
    return jsonify({
        'items': paginated_logs,
        'total': len(filtered_logs),
        'page': page,
        'page_size': page_size,
        'total_pages': (len(filtered_logs) + page_size - 1) // page_size,
    }), 200

@app.route('/api/audit/pii-detections', methods=['GET'])
def get_pii_detection_logs():
    """Get PII detection logs"""
    # Return subset of audit logs that are analyze operations
    detection_logs = [log for log in audit_logs_db if log['operation'] == 'analyze']
    return jsonify({
        'items': detection_logs[:50],
        'total': len(detection_logs),
        'page': 1,
        'page_size': 50,
        'total_pages': 1,
    }), 200

@app.route('/api/audit/anonymizations', methods=['GET'])
def get_anonymization_logs():
    """Get anonymization logs"""
    # Return subset of audit logs that are anonymize/process operations
    anon_logs = [log for log in audit_logs_db if log['operation'] in ['anonymize', 'process']]
    return jsonify({
        'items': anon_logs[:50],
        'total': len(anon_logs),
        'page': 1,
        'page_size': 50,
        'total_pages': 1,
    }), 200

@app.route('/api/audit/stats', methods=['GET'])
def get_audit_stats():
    """Get audit statistics"""
    today = datetime.now().date()
    today_logs = [log for log in audit_logs_db if datetime.fromisoformat(log['timestamp']).date() == today]
    
    pii_detected_today = sum(log['pii_detected'] for log in today_logs)
    pii_anonymized_today = sum(log['pii_anonymized'] for log in today_logs)
    
    # Calculate top users
    user_stats = {}
    for log in audit_logs_db:
        user = log['user']
        if user not in user_stats:
            user_stats[user] = {'operations_count': 0, 'pii_detected': 0, 'last_activity': log['timestamp']}
        user_stats[user]['operations_count'] += 1
        user_stats[user]['pii_detected'] += log['pii_detected']
    
    top_users = sorted(
        [{'user': k, **v} for k, v in user_stats.items()],
        key=lambda x: x['operations_count'],
        reverse=True
    )[:5]
    
    # Calculate top applications
    app_stats = {}
    for log in audit_logs_db:
        app_id = log.get('application_id')
        if app_id and app_id not in app_stats:
            app_stats[app_id] = {
                'application_id': app_id,
                'application_name': log['application_name'],
                'operations_count': 0,
                'pii_detected': 0,
                'pii_anonymized': 0,
                'risk_level': 'low',
            }
        if app_id:
            app_stats[app_id]['operations_count'] += 1
            app_stats[app_id]['pii_detected'] += log['pii_detected']
            app_stats[app_id]['pii_anonymized'] += log['pii_anonymized']
    
    top_applications = sorted(
        list(app_stats.values()),
        key=lambda x: x['operations_count'],
        reverse=True
    )[:5]
    
    return jsonify({
        'total_logs': len(audit_logs_db),
        'today_logs': len(today_logs),
        'pii_detected_today': pii_detected_today,
        'pii_anonymized_today': pii_anonymized_today,
        'anonymization_rate': (pii_anonymized_today / pii_detected_today * 100) if pii_detected_today > 0 else 0,
        'top_users': top_users,
        'top_applications': top_applications,
        'recent_violations': [],
    }), 200

@app.route('/api/audit/logs/export', methods=['GET'])
def export_audit_logs():
    """Export audit logs"""
    format_type = request.args.get('format', 'csv')
    
    if format_type == 'csv':
        import csv
        import io
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=audit_logs_db[0].keys())
        writer.writeheader()
        writer.writerows(audit_logs_db)
        
        return output.getvalue(), 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=audit-logs.csv'
        }
    else:
        return jsonify(audit_logs_db), 200

# Compliance Reports

@app.route('/api/compliance/reports', methods=['GET'])
def get_compliance_reports():
    """Get compliance reports"""
    report_type = request.args.get('type', 'general')
    
    # Generate mock report
    now = datetime.now()
    last_month = datetime(now.year, now.month - 1, 1) if now.month > 1 else datetime(now.year - 1, 12, 1)
    last_month_end = datetime(now.year, now.month, 1) - timedelta(days=1)
    
    total_ops = len(audit_logs_db)
    pii_detected = sum(log['pii_detected'] for log in audit_logs_db)
    pii_anonymized = sum(log['pii_anonymized'] for log in audit_logs_db)
    
    report = {
        'id': 'report-1',
        'period_start': last_month.isoformat(),
        'period_end': last_month_end.isoformat(),
        'report_type': report_type,
        'total_operations': total_ops,
        'pii_detected': pii_detected,
        'pii_anonymized': pii_anonymized,
        'compliance_score': (pii_anonymized / pii_detected * 100) if pii_detected > 0 else 100,
        'violations': [],
        'top_risky_applications': [],
        'pii_exposure_trend': [],
        'entity_type_breakdown': [],
    }
    
    return jsonify([report]), 200

@app.route('/api/compliance/reports/<report_id>', methods=['GET'])
def get_compliance_report(report_id):
    """Get specific compliance report"""
    # Return mock report
    return jsonify({
        'id': report_id,
        'period_start': datetime.now().isoformat(),
        'period_end': datetime.now().isoformat(),
        'report_type': 'general',
        'total_operations': len(audit_logs_db),
        'pii_detected': 1000,
        'pii_anonymized': 950,
        'compliance_score': 95.0,
        'violations': [],
        'top_risky_applications': [],
        'pii_exposure_trend': [],
        'entity_type_breakdown': [],
    }), 200

@app.route('/api/compliance/reports/generate', methods=['POST'])
def generate_compliance_report():
    """Generate new compliance report"""
    data = request.get_json()
    report_type = data.get('report_type', 'general')
    period_start = data.get('period_start')
    period_end = data.get('period_end')
    
    # Generate report
    report = {
        'id': f'report-{datetime.now().timestamp()}',
        'period_start': period_start,
        'period_end': period_end,
        'report_type': report_type,
        'total_operations': len(audit_logs_db),
        'pii_detected': sum(log['pii_detected'] for log in audit_logs_db),
        'pii_anonymized': sum(log['pii_anonymized'] for log in audit_logs_db),
        'compliance_score': 94.5,
        'violations': [],
        'top_risky_applications': [],
        'pii_exposure_trend': [],
        'entity_type_breakdown': [],
    }
    
    return jsonify(report), 200

@app.route('/api/compliance/reports/<report_id>/export', methods=['GET'])
def export_compliance_report(report_id):
    """Export compliance report"""
    format_type = request.args.get('format', 'pdf')
    
    # Return mock data
    return jsonify({'message': 'Export feature - mock data'}), 200

@app.route('/api/compliance/violations', methods=['GET'])
def get_violations():
    """Get compliance violations"""
    return jsonify({
        'items': [],
        'total': 0,
        'page': 1,
        'page_size': 50,
        'total_pages': 0,
    }), 200

@app.route('/api/compliance/violations/<violation_id>', methods=['PATCH'])
def update_violation_status(violation_id):
    """Update violation status"""
    data = request.get_json()
    return jsonify({'message': 'Violation updated'}), 200

@app.route('/api/compliance/risky-applications', methods=['GET'])
def get_risky_applications():
    """Get risky applications"""
    risky_apps = [
        {
            'application_id': 'app-1',
            'application_name': 'Customer Portal',
            'risk_score': 78,
            'pii_exposure_count': 856,
            'unprotected_pii_count': 33,
            'violations_count': 2,
            'last_incident': (datetime.now() - timedelta(days=2)).isoformat(),
        },
        {
            'application_id': 'app-3',
            'application_name': 'Admin Dashboard',
            'risk_score': 65,
            'pii_exposure_count': 234,
            'unprotected_pii_count': 12,
            'violations_count': 1,
            'last_incident': (datetime.now() - timedelta(days=7)).isoformat(),
        },
    ]
    return jsonify(risky_apps), 200

@app.route('/api/compliance/pii-exposure-trend', methods=['GET'])
def get_pii_exposure_trend():
    """Get PII exposure trend"""
    days = int(request.args.get('days', 30))
    
    trend_data = []
    for i in range(days):
        date = datetime.now() - timedelta(days=days - i - 1)
        trend_data.append({
            'timestamp': date.isoformat(),
            'value': random.randint(300, 500),
            'label': date.strftime('%b %d'),
        })
    
    return jsonify(trend_data), 200

@app.route('/api/compliance/entity-type-breakdown', methods=['GET'])
def get_entity_type_breakdown():
    """Get entity type breakdown"""
    breakdown = [
        {'entity_type': 'EMAIL_ADDRESS', 'count': 4523, 'percentage': 36.3, 'anonymized_count': 4401, 'anonymization_rate': 97.3},
        {'entity_type': 'PHONE_NUMBER', 'count': 3234, 'percentage': 26.0, 'anonymized_count': 3156, 'anonymization_rate': 97.6},
        {'entity_type': 'CREDIT_CARD', 'count': 2156, 'percentage': 17.3, 'anonymized_count': 2089, 'anonymization_rate': 96.9},
        {'entity_type': 'US_SSN', 'count': 1456, 'percentage': 11.7, 'anonymized_count': 1423, 'anonymization_rate': 97.7},
        {'entity_type': 'PERSON', 'count': 1087, 'percentage': 8.7, 'anonymized_count': 1054, 'anonymization_rate': 97.0},
    ]
    return jsonify(breakdown), 200


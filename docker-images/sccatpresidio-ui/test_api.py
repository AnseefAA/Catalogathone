"""
Test script to verify policy API endpoints work correctly
Run this to test the API without the React frontend
"""
from app import app
import json

if __name__ == '__main__':
    with app.test_client() as client:
        print("Testing Policy API Endpoints\n")
        print("=" * 50)
        
        # Test 1: List applications
        print("\n1. GET /api/policies/applications")
        response = client.get('/api/policies/applications')
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.content_type}")
        print(f"Response: {json.dumps(response.get_json(), indent=2)}")
        
        # Test 2: List policies
        print("\n2. GET /api/policies")
        response = client.get('/api/policies')
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.content_type}")
        print(f"Response: {json.dumps(response.get_json(), indent=2)[:200]}...")
        
        # Test 3: Get stats
        print("\n3. GET /api/policies/stats")
        response = client.get('/api/policies/stats')
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.content_type}")
        print(f"Response: {json.dumps(response.get_json(), indent=2)}")
        
        print("\n" + "=" * 50)
        print("All tests completed!")

# Made with Bob

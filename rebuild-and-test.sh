#!/bin/bash
set -e

echo "========================================="
echo "Rebuilding Presidio Images"
echo "========================================="

# Stop and remove old containers
echo "Cleaning up old containers..."
docker rm -f analyzer anonymizer 2>/dev/null || true

# Build analyzer
echo ""
echo "Building Analyzer..."
cd docker-images/sccatpresidio-analyzer
docker build -t sccatpresidio-analyzer:2.2.0 .
cd ../..

# Build anonymizer
echo ""
echo "Building Anonymizer..."
cd docker-images/sccatpresidio-anonymizer
docker build -t sccatpresidio-anonymizer:2.2.0 .
cd ../..

# Start containers
echo ""
echo "Starting containers..."
docker run -d -p 3000:3000 --name analyzer sccatpresidio-analyzer:2.2.0
docker run -d -p 3001:3000 --name anonymizer sccatpresidio-anonymizer:2.2.0

# Wait for startup
echo ""
echo "Waiting for services to start..."
sleep 10

# Test health endpoints
echo ""
echo "========================================="
echo "Testing Health Endpoints"
echo "========================================="

echo "Analyzer health:"
curl -s http://localhost:3000/health | jq '.'

echo ""
echo "Anonymizer health:"
curl -s http://localhost:3001/health | jq '.'

# Test analyzer
echo ""
echo "========================================="
echo "Testing Analyzer"
echo "========================================="

ANALYZER_RESULT=$(curl -s -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "My name is John Doe and my email is john@example.com",
    "language": "en"
  }')

echo "Analyzer result:"
echo "$ANALYZER_RESULT" | jq '.'

# Test anonymizer
echo ""
echo "========================================="
echo "Testing Anonymizer"
echo "========================================="

curl -s -X POST http://localhost:3001/anonymize \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"My name is John Doe and my email is john@example.com\",
    \"analyzer_results\": $ANALYZER_RESULT
  }" | jq '.'

echo ""
echo "========================================="
echo "✅ All tests completed!"
echo "========================================="
echo ""
echo "Analyzer running on: http://localhost:3000"
echo "Anonymizer running on: http://localhost:3001"
echo ""
echo "View Swagger docs:"
echo "  Analyzer: http://localhost:3000/docs"
echo "  Anonymizer: http://localhost:3001/docs"

# Made with Bob

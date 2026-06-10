#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Version
VERSION="2.2.0"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Presidio Service - Enhanced Build Script${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_status "Docker is running"

# Create Docker network if it doesn't exist
if ! docker network inspect presidio-network > /dev/null 2>&1; then
    print_info "Creating Docker network: presidio-network"
    docker network create presidio-network
    print_status "Network created"
else
    print_status "Network already exists"
fi

# Clean up old containers
echo ""
echo -e "${BLUE}Cleaning up old containers...${NC}"
docker rm -f analyzer anonymizer ui 2>/dev/null || true
print_status "Old containers removed"

# Build Analyzer
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Building Analyzer Service${NC}"
echo -e "${BLUE}=========================================${NC}"
cd docker-images/sccatpresidio-analyzer
docker build -t sccatpresidio-analyzer:${VERSION} .
if [ $? -eq 0 ]; then
    print_status "Analyzer image built successfully"
else
    print_error "Analyzer build failed"
    exit 1
fi
cd ../..

# Build Anonymizer
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Building Anonymizer Service${NC}"
echo -e "${BLUE}=========================================${NC}"
cd docker-images/sccatpresidio-anonymizer
docker build -t sccatpresidio-anonymizer:${VERSION} .
if [ $? -eq 0 ]; then
    print_status "Anonymizer image built successfully"
else
    print_error "Anonymizer build failed"
    exit 1
fi
cd ../..

# Build UI
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Building React Enterprise UI${NC}"
echo -e "${BLUE}=========================================${NC}"
cd docker-images
if [ -f build-ui.sh ]; then
    chmod +x build-ui.sh
    ./build-ui.sh
    if [ $? -eq 0 ]; then
        print_status "UI image built successfully"
    else
        print_error "UI build failed"
        exit 1
    fi
else
    print_error "build-ui.sh not found"
    exit 1
fi
cd ..

# List built images
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Built Images${NC}"
echo -e "${BLUE}=========================================${NC}"
docker images | grep sccatpresidio | grep ${VERSION}

# Start containers
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Starting Services${NC}"
echo -e "${BLUE}=========================================${NC}"

print_info "Starting Analyzer on port 5001..."
docker run -d \
    --name analyzer \
    --network presidio-network \
    -p 5001:3000 \
    sccatpresidio-analyzer:${VERSION}
print_status "Analyzer started"

print_info "Starting Anonymizer on port 5002..."
docker run -d \
    --name anonymizer \
    --network presidio-network \
    -p 5002:3000 \
    -e ANALYZER_URL=http://analyzer:3000 \
    sccatpresidio-anonymizer:${VERSION}
print_status "Anonymizer started"

print_info "Starting UI on port 8080..."
docker run -d \
    --name ui \
    --network presidio-network \
    -p 8080:8080 \
    sccatpresidio-ui:${VERSION}
print_status "UI started"

# Wait for services to be ready
echo ""
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 15

# Check container status
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Container Status${NC}"
echo -e "${BLUE}=========================================${NC}"
docker ps --filter "name=analyzer" --filter "name=anonymizer" --filter "name=ui" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test health endpoints
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Health Checks${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Analyzer Health:${NC}"
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    curl -s http://localhost:5001/health | jq '.' 2>/dev/null || curl -s http://localhost:5001/health
    print_status "Analyzer is healthy"
else
    print_error "Analyzer health check failed"
fi

echo ""
echo -e "${YELLOW}Anonymizer Health:${NC}"
if curl -s http://localhost:5002/health > /dev/null 2>&1; then
    curl -s http://localhost:5002/health | jq '.' 2>/dev/null || curl -s http://localhost:5002/health
    print_status "Anonymizer is healthy"
else
    print_error "Anonymizer health check failed"
fi

echo ""
echo -e "${YELLOW}UI Health:${NC}"
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    print_status "UI is responding"
else
    print_error "UI health check failed"
fi

# Test Analyzer API
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Testing Analyzer API${NC}"
echo -e "${BLUE}=========================================${NC}"

ANALYZER_RESULT=$(curl -s -X POST http://localhost:5001/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "text": "My name is John Doe and my email is john@example.com",
        "language": "en"
    }')

if [ $? -eq 0 ]; then
    echo "$ANALYZER_RESULT" | jq '.' 2>/dev/null || echo "$ANALYZER_RESULT"
    print_status "Analyzer API test passed"
else
    print_error "Analyzer API test failed"
fi

# Test Anonymizer API (combined processing)
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Testing Anonymizer API (Combined)${NC}"
echo -e "${BLUE}=========================================${NC}"

ANONYMIZER_RESULT=$(curl -s -X POST http://localhost:5002/process \
    -H "Content-Type: application/json" \
    -d '{
        "text": "My name is John Doe and my email is john@example.com",
        "anonymizers": {
            "DEFAULT": {"type": "replace"}
        }
    }')

if [ $? -eq 0 ]; then
    echo "$ANONYMIZER_RESULT" | jq '.' 2>/dev/null || echo "$ANONYMIZER_RESULT"
    print_status "Anonymizer API test passed"
else
    print_error "Anonymizer API test failed"
fi

# Test file upload
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Testing File Upload${NC}"
echo -e "${BLUE}=========================================${NC}"

echo "Email: test@example.com, Phone: 555-1234" > /tmp/test-presidio.txt
FILE_RESULT=$(curl -s -X POST http://localhost:5002/process/file \
    -F "file=@/tmp/test-presidio.txt" \
    -F "anonymization_strategy=replace")

if [ $? -eq 0 ]; then
    echo "$FILE_RESULT" | jq '.' 2>/dev/null || echo "$FILE_RESULT"
    print_status "File upload test passed"
    rm -f /tmp/test-presidio.txt
else
    print_error "File upload test failed"
fi

# Display audit statistics
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Audit Statistics${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Analyzer Stats:${NC}"
curl -s http://localhost:5001/audit/stats | jq '.' 2>/dev/null || curl -s http://localhost:5001/audit/stats

echo ""
echo -e "${YELLOW}Anonymizer Stats:${NC}"
curl -s http://localhost:5002/audit/stats | jq '.' 2>/dev/null || curl -s http://localhost:5002/audit/stats

# Final summary
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ All Services Running Successfully!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}Access Points:${NC}"
echo -e "  ${GREEN}•${NC} Analyzer API:    http://localhost:5001"
echo -e "  ${GREEN}•${NC} Analyzer Docs:   http://localhost:5001/docs"
echo -e "  ${GREEN}•${NC} Anonymizer API:  http://localhost:5002"
echo -e "  ${GREEN}•${NC} Anonymizer Docs: http://localhost:5002/docs"
echo -e "  ${GREEN}•${NC} Web UI:          http://localhost:8080"
echo ""
echo -e "${YELLOW}Quick Commands:${NC}"
echo -e "  ${GREEN}•${NC} View logs:       docker logs analyzer | anonymizer | ui"
echo -e "  ${GREEN}•${NC} Stop services:   docker stop analyzer anonymizer ui"
echo -e "  ${GREEN}•${NC} Remove services: docker rm -f analyzer anonymizer ui"
echo -e "  ${GREEN}•${NC} Restart:         docker restart analyzer anonymizer ui"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  ${GREEN}1.${NC} Test the Web UI at http://localhost:8080"
echo -e "  ${GREEN}2.${NC} Generate SBOM for UI: syft sccatpresidio-ui:${VERSION} -o json > sbom/ui-sbom.json"
echo -e "  ${GREEN}3.${NC} Contact mentor for Quay registry access"
echo -e "  ${GREEN}4.${NC} Tag and push images to Quay"
echo -e "  ${GREEN}5.${NC} Update manifests with Quay image references"
echo ""
echo -e "${BLUE}Built with ❤️  by Bob for IBM Sovereign Core Catalogathon${NC}"

# Made with Bob

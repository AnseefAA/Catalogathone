#!/bin/bash
set -e

echo "========================================="
echo "Building Presidio Enterprise UI"
echo "========================================="

# Check if presidio-enterprise-ui exists
if [ ! -d "../presidio-enterprise-ui" ]; then
    echo "Error: presidio-enterprise-ui directory not found!"
    echo "Please ensure the presidio-enterprise-ui folder exists at the same level as docker-images"
    exit 1
fi

# Build from the docker-images directory
cd "$(dirname "$0")"

echo ""
echo "Building UI Docker image..."
echo "This will:"
echo "1. Build the React application from presidio-enterprise-ui"
echo "2. Create a production-ready Docker image with Nginx"
echo "3. Configure API proxying to analyzer and anonymizer services"
echo ""

# Build the Docker image
# The build context is the parent directory so we can access presidio-enterprise-ui
docker build \
    -f sccatpresidio-ui/Dockerfile \
    -t sccatpresidio-ui:2.2.0 \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    ..

echo ""
echo "========================================="
echo "✅ UI Image Built Successfully!"
echo "========================================="
echo ""
echo "Image: sccatpresidio-ui:2.2.0"
echo ""
echo "To run the UI:"
echo "  docker run -d -p 8080:8080 \\"
echo "    --name ui \\"
echo "    --network presidio-network \\"
echo "    sccatpresidio-ui:2.2.0"
echo ""
echo "Access at: http://localhost:8080"
echo ""

# Made with Bob
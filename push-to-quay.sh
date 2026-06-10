#!/bin/bash
set -e

REGISTRY="dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com"
NAMESPACE="sccat-ef0e5615-13bf-46a4-a9aa-60907af62881"
VERSION="2.2.0"

echo "=========================================="
echo "Pushing Presidio Images to Quay Registry"
echo "=========================================="
echo ""

# Array of images
images=("sccatpresidio-analyzer" "sccatpresidio-anonymizer" "sccatpresidio-ui")

for image in "${images[@]}"; do
    echo "Processing: $image:$VERSION"
    echo "---"
    
    # Tag the image
    echo "Tagging: $image:$VERSION -> $REGISTRY/$NAMESPACE/$image:$VERSION"
    docker tag $image:$VERSION $REGISTRY/$NAMESPACE/$image:$VERSION
    
    # Push the image
    echo "Pushing: $REGISTRY/$NAMESPACE/$image:$VERSION"
    docker push $REGISTRY/$NAMESPACE/$image:$VERSION
    
    echo "✓ Successfully pushed $image:$VERSION"
    echo ""
done

echo "=========================================="
echo "All images pushed successfully!"
echo "=========================================="
echo ""
echo "Images available at:"
for image in "${images[@]}"; do
    echo "  - $REGISTRY/$NAMESPACE/$image:$VERSION"
done

# Made with Bob

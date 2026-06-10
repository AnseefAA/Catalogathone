# Building Presidio Images on Red Hat UBI

This directory contains Dockerfiles and custom FastAPI applications to rebuild Microsoft Presidio services on Red Hat Universal Base Image (UBI) 9 for IBM Sovereign Core compliance.

## Important Note

Presidio packages (`presidio-analyzer` and `presidio-anonymizer`) provide only the core engines as Python libraries, not ready-to-run applications. We've created custom FastAPI wrappers (`app.py`) that expose these engines via REST APIs compatible with Presidio's standard API.

## Prerequisites

- Docker or Podman installed
- Access to Red Hat Container Registry (registry.access.redhat.com)
- Access to Quay registry for pushing images

## Build Instructions

### 1. Build Analyzer Image

```bash
cd docker-images/sccatpresidio-analyzer
docker build -t sccatpresidio-analyzer:2.2.0 .
```

Or with Podman:
```bash
podman build -t sccatpresidio-analyzer:2.2.0 .
```

### 2. Build Anonymizer Image

```bash
cd docker-images/sccatpresidio-anonymizer
docker build -t sccatpresidio-anonymizer:2.2.0 .
```

Or with Podman:
```bash
podman build -t sccatpresidio-anonymizer:2.2.0 .
```

## Tag and Push to Quay

Once you have Quay registry access from your mentor, tag and push the images:

### Analyzer

```bash
# Tag for Quay (replace <quay-org> with your organization)
docker tag sccatpresidio-analyzer:2.2.0 quay.io/<quay-org>/sccatpresidio-analyzer:2.2.0
docker tag sccatpresidio-analyzer:2.2.0 quay.io/<quay-org>/sccatpresidio-analyzer:2.2
docker tag sccatpresidio-analyzer:2.2.0 quay.io/<quay-org>/sccatpresidio-analyzer:latest

# Login to Quay
docker login quay.io

# Push images
docker push quay.io/<quay-org>/sccatpresidio-analyzer:2.2.0
docker push quay.io/<quay-org>/sccatpresidio-analyzer:2.2
docker push quay.io/<quay-org>/sccatpresidio-analyzer:latest
```

### Anonymizer

```bash
# Tag for Quay
docker tag sccatpresidio-anonymizer:2.2.0 quay.io/<quay-org>/sccatpresidio-anonymizer:2.2.0
docker tag sccatpresidio-anonymizer:2.2.0 quay.io/<quay-org>/sccatpresidio-anonymizer:2.2
docker tag sccatpresidio-anonymizer:2.2.0 quay.io/<quay-org>/sccatpresidio-anonymizer:latest

# Push images
docker push quay.io/<quay-org>/sccatpresidio-anonymizer:2.2.0
docker push quay.io/<quay-org>/sccatpresidio-anonymizer:2.2
docker push quay.io/<quay-org>/sccatpresidio-anonymizer:latest
```

## Update Manifests

After pushing to Quay, update the image references in:

1. `catalogathon-gitops-run/services/sccatpresidio/latest/manifests/deployment-analyzer.yaml`
2. `catalogathon-gitops-run/services/sccatpresidio/latest/manifests/deployment-anonymizer.yaml`
3. `catalogathon-gitops-run/services/sccatpresidio/latest/imagesetconfiguration.yaml`

Change from:
```yaml
image: mcr.microsoft.com/presidio-analyzer:2.2.0
```

To:
```yaml
image: quay.io/<quay-org>/sccatpresidio-analyzer:2.2.0
```

## Generate New SBOM

After building the images, regenerate the SBOM files:

```bash
# Analyzer SBOM
syft sccatpresidio-analyzer:2.2.0 -o json > catalogathon-gitops-run/services/sccatpresidio/latest/sbom/analyzer-sbom.json

# Anonymizer SBOM
syft sccatpresidio-anonymizer:2.2.0 -o json > catalogathon-gitops-run/services/sccatpresidio/latest/sbom/anonymizer-sbom.json
```

## Image Details

### Base Image
- **Red Hat UBI 9 Python 3.11**: `registry.access.redhat.com/ubi9/python-311:latest`
- Complies with Red Hat base image requirement
- Runs as non-root user (UID 1000)
- Security hardened

### Presidio Versions
- **presidio-analyzer**: 2.2.362
- **presidio-anonymizer**: 2.2.362
- **fastapi**: 0.109.2
- **uvicorn**: 0.27.1
- **spacy**: 3.7.2 (analyzer only)
- **en_core_web_lg**: 3.7.1 (analyzer only)

### Custom Components
- **app.py**: FastAPI application wrapping Presidio engines
- **start.sh**: Startup script with proper environment variable handling

### Security Features
- Non-root user (UID 1000)
- Minimal system dependencies
- Health checks included
- No unnecessary packages
- LOG_LEVEL properly configured (lowercase: info, debug, error, etc.)

## Testing Locally

Test the built images locally before pushing:

```bash
# Test analyzer
docker run -p 3000:3000 sccatpresidio-analyzer:2.2.0

# Test anonymizer
docker run -p 3001:3000 sccatpresidio-anonymizer:2.2.0

# Health check
curl http://localhost:3000/health
```

## Troubleshooting

### Build fails with permission errors
- Ensure you're using the correct user (1000) in Dockerfile
- Check directory permissions

### Image too large
- Current images are optimized with `--no-cache-dir` for pip
- DNF cache is cleaned after package installation
- Consider multi-stage builds if size is critical

### Runtime errors
- Check logs: `docker logs <container-id>`
- Verify environment variables are set correctly
- Ensure ports 3000 and 3001 are available

## Next Steps

1. Build both images
2. Test locally
3. Get Quay access from mentor
4. Push to Quay registry
5. Update manifest files with new image references
6. Regenerate SBOM files
7. Test deployment with new images
8. Submit PR

## Contact

For Quay access and questions:
- **Mentor**: Thierry Supplisson (thierry.supplisson@ie.ibm.com)
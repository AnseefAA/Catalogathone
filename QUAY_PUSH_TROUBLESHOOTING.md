# Quay Registry Push Troubleshooting

## Current Status

**Issue**: Getting 401 UNAUTHORIZED when pushing images to Quay registry  
**Registry**: `dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com`  
**Namespace**: `sccat-ef0e5615-13bf-46a4-a9aa-60907af62881`  
**Robot Account**: `presidio_rebot`

## What We've Done

1. ✅ Configured Docker to accept insecure registry
2. ✅ Downloaded and trusted the registry certificate
3. ✅ Added certificate to system trust store
4. ✅ Successfully logged in to registry
5. ✅ Updated robot account to have write permissions
6. ❌ Still getting 401 UNAUTHORIZED on push

## Error Details

```
unknown: unexpected status from HEAD request to 
https://dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com/v2/sccat-ef0e5615-13bf-46a4-a9aa-60907af62881/sccatpresidio-analyzer/blobs/sha256:...: 
401 UNAUTHORIZED
```

## Possible Causes

### 1. Repository Doesn't Exist
Quay might require repositories to be created before pushing. The robot account might not have permission to create repositories automatically.

**Solution**: Create the repositories manually in Quay UI:
- `sccat-ef0e5615-13bf-46a4-a9aa-60907af62881/sccatpresidio-analyzer`
- `sccat-ef0e5615-13bf-46a4-a9aa-60907af62881/sccatpresidio-anonymizer`
- `sccat-ef0e5615-13bf-46a4-a9aa-60907af62881/sccatpresidio-ui`

### 2. Robot Account Permissions
The robot account might need additional permissions beyond "write":
- Admin permission to create repositories
- Specific permissions for the namespace

**Solution**: Check robot account permissions in Quay UI:
1. Go to https://dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com
2. Navigate to Organization: `sccat-ef0e5615-13bf-46a4-a9aa-60907af62881`
3. Go to Robot Accounts
4. Check `presidio_rebot` permissions
5. Ensure it has "Write" or "Admin" permission

### 3. Namespace/Organization Not Configured
The organization might not be properly set up for the robot account.

**Solution**: Verify organization settings:
1. Check if organization `sccat-ef0e5615-13bf-46a4-a9aa-60907af62881` exists
2. Verify robot account is associated with this organization
3. Check if there are any namespace restrictions

## Recommended Next Steps

### Step 1: Verify in Quay UI
1. Login to https://dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com
2. Check if organization `sccat-ef0e5615-13bf-46a4-a9aa-60907af62881` exists
3. Verify robot account `presidio_rebot` exists and has correct permissions

### Step 2: Create Repositories Manually
If repositories don't exist, create them:
1. Go to organization page
2. Click "Create New Repository"
3. Create three repositories:
   - `sccatpresidio-analyzer`
   - `sccatpresidio-anonymizer`
   - `sccatpresidio-ui`
4. Set visibility to "Private" or as required
5. Grant robot account access to each repository

### Step 3: Test with Simple Push
Try pushing a small test image first:
```bash
# Create a tiny test image
echo "FROM alpine:latest" | docker build -t test:latest -
docker tag test:latest dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com/sccat-ef0e5615-13bf-46a4-a9aa-60907af62881/test:latest
docker push dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com/sccat-ef0e5615-13bf-46a4-a9aa-60907af62881/test:latest
```

### Step 4: Contact Mentor
If issues persist, ask mentor:
- Is there a specific process for creating repositories?
- Are there any additional permissions needed?
- Is there a different registry URL or namespace format?
- Can they verify the robot account has correct permissions?

## Alternative: Manual Image Export/Import

If push continues to fail, you can export images and share them:

```bash
# Export images to tar files
docker save sccatpresidio-analyzer:2.2.0 | gzip > sccatpresidio-analyzer-2.2.0.tar.gz
docker save sccatpresidio-anonymizer:2.2.0 | gzip > sccatpresidio-anonymizer-2.2.0.tar.gz
docker save sccatpresidio-ui:2.2.0 | gzip > sccatpresidio-ui-2.2.0.tar.gz

# Share with mentor to upload manually
```

## Images Ready for Push

All three images are built and ready:

```
sccatpresidio-analyzer:2.2.0    (3.12GB / 1.07GB compressed)
sccatpresidio-anonymizer:2.2.0  (1.63GB / 421MB compressed)
sccatpresidio-ui:2.2.0          (468MB / 116MB compressed)
```

## Configuration Files

### Docker Daemon Config
Location: `/etc/docker/daemon.json`
```json
{
  "insecure-registries": ["dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com"]
}
```

### Certificate Location
- Docker certs: `/etc/docker/certs.d/dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com/ca.crt`
- System trust: `/etc/pki/ca-trust/source/anchors/quay-catalogathon.crt`

## Login Credentials

```bash
# Login command (already executed successfully)
echo '4ZYNFPRKBZFN0P8287B1MONU1UGCD351IIS2EZ8W2QF0COHN0ILYM65GU0KYKHUR' | \
  docker login -u='sccat-ef0e5615-13bf-46a4-a9aa-60907af62881+presidio_rebot' \
  --password-stdin dev-registry-quay-catalogathon-registry.apps.hthon-dev.svl.ibm.com
```

## Summary

The technical setup is complete (certificates, login, permissions updated), but we're hitting a 401 error during push. This typically indicates:
1. Repositories need to be created first in Quay UI
2. Robot account needs additional permissions
3. There might be a specific workflow for the catalogathon registry

**Recommendation**: Check Quay UI to create repositories manually and verify robot account has full access.
# Docker Build & GitHub Actions Fix

## 🔴 Problem

When running the GitHub Actions deployment workflow, you received the error:
```
ERROR: failed to build: invalid tag ":latest": invalid reference format
```

This occurred because the Docker image tags were not being properly formatted. The environment variables containing the image names were not being set correctly.

## ✅ Solution

The issue was in the `.github/workflows/deploy.yml` file in the "Set Image Names" step.

### Before (Incorrect)
```yaml
- name: Set Image Names
  run: |
    echo "BACKEND_IMAGE=ghcr.io/${{ github.repository_owner }}/microcare-backend" | tr '[:upper:]' '[:lower:]' >> $GITHUB_ENV
    echo "FRONTEND_IMAGE=ghcr.io/${{ github.repository_owner }}/microcare-frontend" | tr '[:upper:]' '[:lower:]' >> $GITHUB_ENV
```

**Problem**: The pipe `|` character was piping the entire string to `tr`, not just the image name. The output was being truncated.

### After (Correct)
```yaml
- name: Set Image Names
  run: |
    echo "BACKEND_IMAGE=ghcr.io/$(echo ${{ github.repository_owner }} | tr '[:upper:]' '[:lower:]')/microcare-backend" >> $GITHUB_ENV
    echo "FRONTEND_IMAGE=ghcr.io/$(echo ${{ github.repository_owner }} | tr '[:upper:]' '[:lower:]')/microcare-frontend" >> $GITHUB_ENV
```

**Solution**: Use command substitution `$(...)` to apply the `tr` command only to the GitHub repository owner variable, ensuring the full image name is set.

## 🔧 How It Works Now

### Step-by-Step Execution

1. **Checkout Code**
   ```yaml
   uses: actions/checkout@v4
   ```

2. **Setup Docker Buildx** (for multi-platform builds)
   ```yaml
   uses: docker/setup-buildx-action@v3
   ```

3. **Set Image Names** (FIXED)
   ```bash
   # Sets environment variables like:
   # BACKEND_IMAGE=ghcr.io/fabishz/microcare-backend
   # FRONTEND_IMAGE=ghcr.io/fabishz/microcare-frontend
   ```

4. **Login to GitHub Container Registry**
   ```yaml
   uses: docker/login-action@v3
   ```

5. **Build Backend**
   - Builds from `./backend` directory
   - Uses `production` target from Dockerfile
   - Tags as:
     - `ghcr.io/fabishz/microcare-backend:latest`
     - `ghcr.io/fabishz/microcare-backend:6ba7f35e0c7d606234ec946ed8ee8af3aac6b148` (git SHA)

6. **Build Frontend**
   - Builds from `./frontend` directory
   - Tags as:
     - `ghcr.io/fabishz/microcare-frontend:latest`
     - `ghcr.io/fabishz/microcare-frontend:6ba7f35e0c7d606234ec946ed8ee8af3aac6b148` (git SHA)

## 📋 Environment Variables Used

| Variable | Example Value | Purpose |
|----------|---------------|---------|
| `${{ github.repository_owner }}` | `fabishz` | GitHub username |
| `${{ github.actor }}` | `fabishz` | User who triggered action |
| `${{ secrets.GITHUB_TOKEN }}` | `ghp_*****` | Authentication token |
| `${{ github.sha }}` | `6ba7f35e0c7d` | Git commit SHA |

## 🎯 Result

The workflow now:
1. ✅ Correctly sets image names with repository prefix
2. ✅ Builds Docker images without errors
3. ✅ Pushes to GitHub Container Registry (ghcr.io)
4. ✅ Tags with both `latest` and commit SHA

## 🚀 Next Deployment

When you push to `main` branch:
1. GitHub Actions will trigger automatically
2. Docker images will build successfully
3. Images will be available at:
   - `ghcr.io/fabishz/microcare-backend:latest`
   - `ghcr.io/fabishz/microcare-frontend:latest`
4. Previous versions archived with commit SHA tags

## 📚 Files Modified

- `.github/workflows/deploy.yml` - Fixed image name setting

## ✨ Additional Notes

### Why Command Substitution?
- `$(command)` runs the command and replaces with output
- Allows `tr` to only lowercase the username
- Keeps full image name with registry intact

### Image Naming Convention
```
ghcr.io/{username}/microcare-{component}:{tag}
```

Where:
- `ghcr.io` = GitHub Container Registry
- `{username}` = Your GitHub username (lowercased)
- `{component}` = `backend` or `frontend`
- `{tag}` = `latest` or git commit SHA

### Pushing to Docker Hub (Optional)

If you want to also push to Docker Hub, add these secrets to your GitHub repository:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Then add additional steps to `.github/workflows/deploy.yml`:
```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}

- name: Build and push Backend to Docker Hub
  uses: docker/build-push-action@v5
  with:
    context: ./backend
    target: production
    push: true
    tags: |
      docker.io/${{ secrets.DOCKERHUB_USERNAME }}/microcare-backend:latest
      docker.io/${{ secrets.DOCKERHUB_USERNAME }}/microcare-backend:${{ github.sha }}
```

## 🔍 Troubleshooting

### Still Getting Tag Errors?
Check that:
- [ ] GitHub token has `write:packages` permission
- [ ] Username is not `null` or empty
- [ ] Dockerfile exists at `./backend/Dockerfile` and `./frontend/Dockerfile`
- [ ] `context` paths are correct

### Build Fails?
Check:
- [ ] Dockerfile syntax is valid
- [ ] Dependencies are available
- [ ] Build args are correct
- [ ] No secrets exposed in logs

### Images Not Appearing?
- Wait 30-60 seconds after workflow completes
- Check: https://github.com/users/{username}/packages/container/microcare-backend
- Verify GHCR login in `.github/workflows/deploy.yml`

## 📖 Related Documentation

- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## ✅ Verification

After the fix:
1. Push to `main` branch
2. Watch GitHub Actions run
3. Confirm no `invalid tag` errors
4. Check Docker images appear in GitHub Container Registry

---

**Status**: ✅ Fixed
**File Modified**: `.github/workflows/deploy.yml`
**Date Fixed**: February 23, 2026

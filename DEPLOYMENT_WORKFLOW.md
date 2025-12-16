# Deployment Workflow

## Automatic Deployments via GitHub

Vercel is configured to automatically deploy when you push to GitHub:
- **Production**: Deploys on push to `master` branch
- **Preview**: Deploys on push to other branches

## How to Deploy

**✅ DO THIS:**
```bash
# Just push to GitHub - Vercel will auto-deploy
git push origin master
```

**❌ DON'T DO THIS:**
```bash
# Don't run manual deployments - creates duplicate deployments
vercel --prod
```

## Removing Duplicate Deployments

If you see duplicate deployments:

1. Go to [Vercel Dashboard](https://vercel.com/tindeveloper/financial-saas/deployments)
2. Find the duplicate/extra deployment
3. Click the **...** menu on that deployment
4. Select **Delete** to remove it

## Configuration

The `vercel.json` file has GitHub deployments enabled:
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "master": true
    }
  }
}
```

This means Vercel will automatically deploy on every push to `master` branch.

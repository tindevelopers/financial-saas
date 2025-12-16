#!/bin/bash

echo "🚀 Financial Categorization SaaS - Deployment Helper"
echo "===================================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 You have uncommitted changes. Committing now..."
    git add .
    git commit -m "feat: Ready for deployment"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "⚠️  No GitHub remote configured"
    echo ""
    echo "Next steps:"
    echo "1. Create repository at: https://github.com/new"
    echo "2. Name it: financial-categorization-saas"
    echo "3. Run: git remote add origin https://github.com/YOUR_USERNAME/financial-categorization-saas.git"
    echo "4. Run: git push -u origin main"
    exit 0
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Go to: https://vercel.com"
    echo "2. Import your repository"
    echo "3. Set Root Directory to: nextjs_space"
    echo "4. Add environment variables (see VERCEL_DEPLOYMENT_GUIDE.md)"
    echo "5. Deploy!"
    echo ""
    echo "📖 Full guide: /home/ubuntu/financial_categorization_saas/VERCEL_DEPLOYMENT_GUIDE.md"
else
    echo ""
    echo "❌ Push failed. Check your GitHub remote and credentials."
fi

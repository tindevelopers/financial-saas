# Financial Categorization SaaS

A multi-tenant SaaS application for automatically categorizing financial transactions using AI.

## ✨ Features

- 🤖 **AI-Powered Categorization** - Automatically categorize transactions with >80% accuracy
- 📄 **Multi-Format Support** - Upload CSV or Excel files from any UK bank
- 📑 **Google Sheets Export** - Export categorized transactions with one click
- 🔒 **Multi-Tenant** - Secure data isolation for each user
- 🎨 **Beautiful UI** - Modern, responsive design
- 🧠 **Learning System** - Improves accuracy from your corrections
- 🇬🇧 **UK Accounting** - 40+ pre-configured UK categories

## 🚀 Quick Start

### Option 1: Follow the Complete Setup Guide

**See:** `../SETUP_GUIDE.md` for detailed step-by-step instructions

Or the PDF version: `../SETUP_GUIDE.pdf`

### Option 2: Quick Commands

```bash
# 1. Install dependencies
yarn install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Initialize database
yarn prisma generate
yarn prisma db push
yarn prisma db seed

# 4. Run development server
yarn dev
```

Open http://localhost:3000

## 📚 Required Setup

### 1. Supabase Database (5 mins)

1. Create account at https://supabase.com
2. Create new project
3. Copy DATABASE_URL (Session mode, port 6543)
4. Add to `.env`
5. Run `yarn prisma db push`

### 2. Google OAuth (10 mins)

1. Create project at https://console.cloud.google.com
2. Enable Google Sheets API
3. Create OAuth credentials
4. Add redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-domain.vercel.app/api/auth/google/callback`
5. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to `.env`

### 3. Deploy to Vercel (5 mins)

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main

# Import to Vercel
# - Go to https://vercel.com
# - Import project
# - Set Root Directory: ./nextjs_space
# - Add environment variables
# - Deploy!
```

## 💻 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **Storage:** AWS S3
- **AI:** OpenAI GPT-4 / Claude
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Deployment:** Vercel

## 📁 Project Structure

```
nextjs_space/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── upload/       # File upload
│   │   ├── categorize/   # AI categorization
│   │   ├── transactions/ # Transaction CRUD
│   │   ├── categories/   # Category management
│   │   └── export/       # Google Sheets export
│   ├── auth/             # Auth pages (signin/signup)
│   ├── dashboard/        # Main dashboard
│   ├── upload/           # File upload page
│   └── transactions/     # Transaction list page
├── components/
│   ├── dashboard/        # Dashboard components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── auth-options.ts   # NextAuth config
│   ├── csv-parser.ts     # CSV/Excel parser
│   ├── aws-config.ts     # S3 config
│   ├── s3.ts             # S3 utilities
│   └── db.ts             # Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
└── scripts/
    └── seed.ts           # Database seed
```

## 🎯 Usage Flow

1. **Sign Up** - Create account (each user = separate tenant)
2. **Upload CSV/Excel** - Drag and drop bank statement
3. **AI Categorization** - Automatic categorization with confidence scores
4. **Review & Correct** - Manually categorize uncertain transactions
5. **System Learns** - Improves accuracy from your corrections
6. **Export** - Send to Google Sheets with one click

## 🔒 Security Features

- Password hashing (bcrypt)
- JWT session tokens
- Row-Level Security (RLS) in database
- Multi-tenant data isolation
- API route protection
- CSRF protection
- SQL injection prevention (Prisma)
- Presigned URLs for secure file uploads

## 📦 Environment Variables

Required variables in `.env`:

```env
# Database - Use connection pooler for serverless (Vercel)
# For Supabase: Use the "Connection Pooling" connection string from Supabase dashboard
# Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_URL="postgresql://..."
# Optional: Direct connection URL for migrations (only needed for local development)
DIRECT_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AWS S3 (configured automatically)
AWS_BUCKET_NAME="..."
AWS_FOLDER_PREFIX="..."

# LLM API (configured automatically)
ABACUSAI_API_KEY="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

## 🛠️ Available Commands

```bash
# Development
yarn dev              # Start dev server (localhost:3000)
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run ESLint

# Database
yarn prisma generate  # Generate Prisma Client
yarn prisma db push   # Push schema to database
yarn prisma db seed   # Seed UK categories
yarn prisma studio    # Open Prisma Studio (GUI)

# Testing
yarn test             # Run tests (if configured)
```

## 📊 Database Schema

### Core Tables

- **User** - User accounts with hashed passwords
- **Transaction** - Financial transactions with AI categorization
- **Upload** - File upload records
- **Category** - UK accounting categories (40+ default)
- **UserCorrection** - Learning system (stores corrections)
- **GoogleSheetsConnection** - OAuth tokens for Google Sheets

### Row-Level Security

All tables have RLS policies that automatically filter by `tenantId`, ensuring complete data isolation between users.

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set Root Directory: `./nextjs_space`
4. Add environment variables
5. Deploy!

### Important Vercel Settings

- **Root Directory:** `./nextjs_space` (⚠️ CRITICAL!)
- **Framework:** Next.js (auto-detected)
- **Build Command:** `yarn build`
- **Install Command:** `yarn install`
- **Output Directory:** `.next`

### Post-Deployment

1. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Update `NEXTAUTH_URL` in Vercel environment variables
3. Update `GOOGLE_REDIRECT_URI` in Vercel and Google Cloud Console
4. Redeploy

## 📝 UK Accounting Categories

### Income Categories
- Sales
- Other Income
- Interest Income

### Expense Categories
- Cost of Goods Sold
- Advertising
- Bank Charges
- Office Expenses
- Professional Fees
- Rent
- Utilities
- Travel
- Meals & Entertainment
- Insurance
- Depreciation
- Repairs & Maintenance
- Telephone & Internet
- Subscriptions
- Drawings
- And 25+ more...

## 🔧 Troubleshooting

### Database Connection Errors

**Error:** `Can't reach database server`
- Check DATABASE_URL is correct
- Use Session mode connection (port 6543)
- Verify Supabase project is not paused

### Google OAuth Errors

**Error:** `redirect_uri_mismatch`
- Ensure redirect URI exactly matches in Google Console
- No trailing slashes
- Case-sensitive

### Build Errors

**Error:** `Module not found`
- Run `yarn install`
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `yarn build`

## 💬 Support

For issues or questions:
1. Check `SETUP_GUIDE.md` for detailed instructions
2. Review error messages in console
3. Check Vercel deployment logs
4. Check Supabase logs

## 🗺️ Roadmap

### ✅ Phase 1-4 (Complete)
- [x] File upload & parsing
- [x] AI categorization
- [x] Manual review interface
- [x] Google Sheets export
- [x] Multi-tenant architecture
- [x] Learning system

### 🖜 Phase 5 (Next)
- [ ] Conversational Q&A interface
- [ ] Income Statement (P&L) generation
- [ ] PDF export
- [ ] Enhanced Google Sheets with formulas

### 📅 Future
- [ ] Receipt OCR
- [ ] Multi-currency support
- [ ] Xero integration
- [ ] Team collaboration
- [ ] Stripe billing
- [ ] Mobile app

## 🎉 Success Metrics

- **Categorization Accuracy:** >80% (with learning)
- **Processing Speed:** ~30s for 100 transactions
- **User Satisfaction:** <30min/month time spent
- **Security:** Zero cross-tenant data leaks

## 📜 License

MIT License - Built with ❤️ for small business owners

---

**Need help?** Check the complete setup guide at `../SETUP_GUIDE.md`

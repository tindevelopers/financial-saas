# Migration Checklist: SaaS Base Structure

Use this checklist to track your migration progress.

## Pre-Migration

- [ ] **Backup database** (CRITICAL!)
  ```bash
  pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
  ```

- [ ] **Verify environment variables**
  - [ ] `DATABASE_URL` is set
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (if needed)

- [ ] **Review Prisma schema**
  - [ ] All models use `@db.Uuid` for IDs
  - [ ] All foreign keys use `@db.Uuid`
  - [ ] User model uses `fullName` (not `name`)
  - [ ] Tenant model has `domain`, `status`, `plan`, `region` fields

## Migration Steps

### Step 1: Apply SaaS Base Migrations

- [ ] **List available migrations**
  ```bash
  ls -la supabase/migrations/
  ```

- [ ] **Apply migrations to Supabase**
  - [ ] Option A: Copy SQL files to Supabase SQL Editor
  - [ ] Option B: Use Supabase CLI (`supabase db push`)
  - [ ] Option C: Use helper script (`./scripts/apply-saas-migrations.sh`)

- [ ] **Verify tables created**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('roles', 'workspaces', 'audit_logs', 'stripe_customers')
  ```

### Step 2: Create Default Roles

- [ ] **Run role creation SQL**
  ```sql
  INSERT INTO roles (id, name, description, coverage, permissions, gradient)
  VALUES (...)
  ```

- [ ] **Verify roles exist**
  ```sql
  SELECT * FROM roles;
  ```

### Step 3: Sync Prisma Schema

- [ ] **Pull database structure**
  ```bash
  yarn prisma db pull
  ```

- [ ] **Generate Prisma Client**
  ```bash
  yarn prisma generate
  ```

- [ ] **Verify no schema drift**
  ```bash
  yarn prisma validate
  ```

### Step 4: Migrate Existing Data

- [ ] **Check if data migration needed**
  ```sql
  SELECT COUNT(*) FROM tenants WHERE id::text NOT LIKE '%-%-%-%-%';
  ```
  - If count > 0: Run migration script
  - If count = 0: Skip to Step 5

- [ ] **Run data migration script**
  ```bash
  tsx scripts/migrate-text-to-uuid.ts
  ```

- [ ] **Verify data migrated**
  ```sql
  -- All IDs should be UUIDs now
  SELECT id FROM tenants LIMIT 5;
  ```

### Step 5: Update User Records

- [ ] **Update user fields**
  ```sql
  UPDATE users SET 
    full_name = COALESCE(full_name, split_part(email, '@', 1)),
    plan = COALESCE(plan, 'free'),
    status = COALESCE(status, 'active')
  WHERE full_name IS NULL OR plan IS NULL OR status IS NULL;
  ```

- [ ] **Assign default roles**
  ```sql
  UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Viewer' LIMIT 1)
  WHERE role_id IS NULL;
  ```

- [ ] **Verify users updated**
  ```sql
  SELECT id, email, full_name, role_id, plan, status FROM users LIMIT 5;
  ```

### Step 6: Update Tenant Records

- [ ] **Update tenant fields**
  ```sql
  UPDATE tenants SET 
    domain = COALESCE(domain, LOWER(REPLACE(name, ' ', '-')) || '.example.com'),
    status = COALESCE(status, 'active'),
    plan = COALESCE(plan, 'free'),
    region = COALESCE(region, 'us-east-1')
  WHERE domain IS NULL OR status IS NULL OR plan IS NULL OR region IS NULL;
  ```

- [ ] **Verify tenants updated**
  ```sql
  SELECT id, name, domain, status, plan, region FROM tenants LIMIT 5;
  ```

### Step 7: Create Prisma Migration

- [ ] **Create migration**
  ```bash
  yarn prisma migrate dev --name migrate_to_saas_base
  ```

- [ ] **Review migration SQL**
  ```bash
  cat prisma/migrations/*/migration.sql
  ```

- [ ] **Verify migration applied**
  ```bash
  yarn prisma migrate status
  ```

## Post-Migration Testing

### Database Tests

- [ ] **Open Prisma Studio**
  ```bash
  yarn prisma studio
  ```

- [ ] **Verify tables**
  - [ ] All SaaS base tables exist
  - [ ] Data is present
  - [ ] Relationships work
  - [ ] IDs are UUIDs

### API Tests

- [ ] **Test signup**
  ```bash
  curl -X POST http://localhost:3000/api/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
  ```

- [ ] **Test transactions API**
  ```bash
  curl http://localhost:3000/api/transactions
  ```

- [ ] **Test categories API**
  ```bash
  curl http://localhost:3000/api/categories
  ```

- [ ] **Test upload API**
  - [ ] Generate presigned URL
  - [ ] Upload file
  - [ ] Complete upload

- [ ] **Test categorization API**
  ```bash
  curl -X POST http://localhost:3000/api/categorize \
    -H "Content-Type: application/json" \
    -d '{"uploadId":"..."}'
  ```

### Frontend Tests

- [ ] **Sign up flow**
  - [ ] Create new account
  - [ ] Verify tenant created
  - [ ] Verify user profile created
  - [ ] Verify default categories created

- [ ] **Sign in flow**
  - [ ] Sign in with existing account
  - [ ] Verify session works
  - [ ] Verify tenant context loaded

- [ ] **Upload flow**
  - [ ] Upload CSV file
  - [ ] Verify transactions created
  - [ ] Verify upload record created

- [ ] **Transaction management**
  - [ ] View transactions list
  - [ ] Filter transactions
  - [ ] Update category
  - [ ] Verify correction recorded

- [ ] **Categorization**
  - [ ] Trigger AI categorization
  - [ ] Verify categories assigned
  - [ ] Verify confidence scores set

- [ ] **Export**
  - [ ] Export to Google Sheets
  - [ ] Verify spreadsheet created
  - [ ] Verify data exported correctly

## Deployment

- [ ] **Commit changes**
  ```bash
  git add .
  git commit -m "Migrate to SaaS base structure"
  ```

- [ ] **Push to trigger deployment**
  ```bash
  git push origin main
  ```

- [ ] **Monitor deployment**
  ```bash
  vercel logs --follow
  ```

- [ ] **Verify production**
  - [ ] Sign up works
  - [ ] Sign in works
  - [ ] Upload works
  - [ ] Transactions display
  - [ ] Categorization works

## Rollback Plan

If something goes wrong:

- [ ] **Stop deployment** (if in progress)
- [ ] **Restore database backup**
  ```bash
  psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
  ```
- [ ] **Revert code changes**
  ```bash
  git revert HEAD
  git push origin main
  ```

## Post-Migration Tasks

- [ ] **Set up RLS policies** in Supabase
- [ ] **Configure Stripe webhooks** (if using Stripe)
- [ ] **Set up audit logging**
- [ ] **Configure workspace features**
- [ ] **Test multi-tenancy isolation**
- [ ] **Update documentation**

## Notes

- Migration date: ___________
- Migration performed by: ___________
- Issues encountered: ___________
- Resolution: ___________


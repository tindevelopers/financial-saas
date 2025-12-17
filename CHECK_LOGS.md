# How to Check Vercel Logs for Upload Errors

## Current Situation

We've added comprehensive logging to the upload route with `[UPLOAD]` prefix. The logs will show:
- Each step of the upload process
- Where failures occur
- Detailed error messages with stack traces

## Methods to Check Logs

### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select project: **financial-saas**
3. Click on the **"Logs"** tab
4. Filter by searching for: `[UPLOAD]` or `upload/complete`
5. Look for recent errors (red entries)

### Method 2: Vercel CLI (Real-time)

```bash
# Start watching logs (will show new logs as they come in)
vercel logs https://financial-saas-ecru.vercel.app

# Or use the specific deployment URL
vercel logs https://financial-saas-1xea01qcp-tindeveloper.vercel.app
```

**Note**: This command waits for NEW logs. If there are no recent requests, it will timeout.

### Method 3: Trigger Upload and Watch Logs

1. Open two terminal windows
2. In Terminal 1, run:
   ```bash
   vercel logs https://financial-saas-ecru.vercel.app
   ```
3. In Terminal 2 (or browser), try uploading a file
4. Watch Terminal 1 for the `[UPLOAD]` logs

## What to Look For

The logs will show step-by-step progress:

```
[UPLOAD] ===== Upload request started =====
[UPLOAD] Step 1: Checking authentication...
[UPLOAD] ✅ Auth successful: { userId: '...', tenantId: '...' }
[UPLOAD] Step 2: Parsing form data...
[UPLOAD] Step 3: Parsing CSV file...
[UPLOAD] Step 4: Creating upload record in database...
[UPLOAD] Step 5: Creating transaction records...
[UPLOAD] Step 6: Updating upload status...
[UPLOAD] ===== Upload completed successfully =====
```

If there's an error, you'll see:
```
[UPLOAD] ===== Upload failed =====
[UPLOAD] Step: <which_step_failed>
[UPLOAD] Error: <error_message>
[UPLOAD] Stack: <stack_trace>
```

## Common Error Locations

Based on the code, errors can occur at:

1. **Authentication** - Step 1
   - Check if session cookies are present
   - Check if user has tenantId

2. **CSV Parsing** - Step 3
   - File format issues
   - Missing required columns
   - Invalid data types

3. **Database Operations** - Steps 4-6
   - Prisma connection issues
   - Missing tables/columns
   - RLS policy blocking inserts
   - Foreign key constraints

## Next Steps

1. **Try uploading a file** - This will generate new logs
2. **Check Vercel dashboard** - Easiest way to see logs
3. **Share the error logs** - If you see `[UPLOAD]` errors, share them so we can fix the issue

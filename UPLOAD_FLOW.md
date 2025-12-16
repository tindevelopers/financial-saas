# Upload Flow Documentation

## Current Upload Flow

### File Storage Location
**Files are NOT currently stored in S3** - they are processed in memory only.

The upload route (`/api/upload/complete`) currently:
1. Receives the file as FormData
2. Parses the CSV in memory
3. Creates database records for transactions
4. **Does NOT upload the file to S3**

### File Storage Path (if implemented)
If files were to be stored in S3, they would be stored at:
- **Bucket**: `AWS_BUCKET_NAME` environment variable
- **Path**: `${AWS_FOLDER_PREFIX}uploads/${timestamp}-${filename}`
- **Example**: `prod/uploads/1234567890-transactions.csv`

### Database Storage
- Upload metadata is stored in the `uploads` table
- The `cloudStoragePath` field stores the intended S3 path (even though file isn't uploaded)
- Transaction data is stored in the `transactions` table

## Upload Route: `/api/upload/complete`

**Method**: POST  
**Authentication**: Required (uses `requireAuth()`)

**Request Body**:
- `file`: File object (FormData)
- `cloudStoragePath`: Optional string path for S3 storage

**Response**:
```json
{
  "uploadId": "uuid",
  "transactionsCreated": 123,
  "errors": []
}
```

**Steps**:
1. ✅ Authentication check
2. ✅ Parse FormData
3. ✅ Parse CSV file
4. ✅ Create upload record in database
5. ✅ Create transaction records
6. ✅ Update upload status to 'completed'

## Logging

Comprehensive logging has been added to track:
- Each step of the upload process
- Success/failure at each stage
- Transaction creation progress
- Error details with stack traces
- Performance timing

Logs are prefixed with `[UPLOAD]` for easy filtering.

## Future Improvements

If file storage is needed:
1. Upload file to S3 using `generatePresignedUploadUrl()` or direct upload
2. Store the actual S3 path in `cloudStoragePath`
3. Add file retrieval endpoint using `getFileUrl()`

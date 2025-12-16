import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createS3Client, getBucketConfig } from './aws-config'

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false
): Promise<{ uploadUrl: string; cloudStoragePath: string }> {
  const s3Client = createS3Client()
  const { bucketName, folderPrefix } = getBucketConfig()

  // Generate cloud storage path
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const cloudStoragePath = isPublic
    ? `${folderPrefix}public/uploads/${timestamp}-${sanitizedFileName}`
    : `${folderPrefix}uploads/${timestamp}-${sanitizedFileName}`

  // Create presigned URL for upload
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

  return { uploadUrl, cloudStoragePath }
}

export async function getFileUrl(cloudStoragePath: string, isPublic = false): Promise<string> {
  const { bucketName } = getBucketConfig()

  if (isPublic) {
    // For public files, return direct URL
    const region = process.env.AWS_REGION || 'us-east-1'
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloudStoragePath}`
  } else {
    // For private files, generate signed URL
    const s3Client = createS3Client()
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: cloudStoragePath,
    })
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  }
}

export async function deleteFile(cloudStoragePath: string): Promise<void> {
  const s3Client = createS3Client()
  const { bucketName } = getBucketConfig()

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cloudStoragePath,
  })

  await s3Client.send(command)
}

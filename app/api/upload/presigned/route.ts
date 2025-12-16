import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { generatePresignedUploadUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuth()
    if (error) return error
    
    const body = await request.json()
    const { fileName, contentType } = body
    
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      )
    }
    
    // Generate presigned URL for S3 upload
    const { uploadUrl, cloudStoragePath } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      false // Private file
    )
    
    return NextResponse.json({
      uploadUrl,
      cloudStoragePath,
    })
  } catch (error: any) {
    console.error('Presigned URL generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL', details: error?.message },
      { status: 500 }
    )
  }
}

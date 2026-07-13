import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_SIZE } from '@/lib/validation';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { encodeBlurHash } from '@/lib/blurhash';

// Cloudinary upload + BlurHash encoding can take a few seconds for larger
// images; the platform default (10s on Vercel Hobby) can be too tight.
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId(request);
  if (!userId) return errorResponse(401, 'Not authenticated');

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return errorResponse(400, 'No file provided');
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return errorResponse(400, 'Unsupported file type. Use JPEG, PNG, WebP, or GIF.');
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return errorResponse(400, `File too large. Max size is ${Math.floor(MAX_UPLOAD_SIZE / 1024 / 1024)}MB.`);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const [uploadResult, blurHash] = await Promise.all([
      uploadBufferToCloudinary(buffer),
      encodeBlurHash(buffer),
    ]);

    return NextResponse.json({
      url: uploadResult.secure_url,
      blurHash,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (err) {
    console.error('Image upload failed', err);
    return errorResponse(500, 'Image upload failed. Please try again.');
  }
}

import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function uploadBufferToCloudinary(buffer: Buffer, folder = 'buddy-script/posts'): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export type ImageSize = 'thumbnail' | 'medium' | 'large';

const SIZE_WIDTHS: Record<ImageSize, number> = {
  thumbnail: 150,
  medium: 600,
  large: 1200,
};

/** Builds a responsive Cloudinary derivative URL on the fly (no pre-generated
 * files needed) by inserting a transformation segment after `/upload/`. */
export function getCloudinaryUrl(secureUrl: string, size: ImageSize): string {
  const width = SIZE_WIDTHS[size];
  const marker = '/upload/';
  const idx = secureUrl.indexOf(marker);
  if (idx === -1) return secureUrl;
  const insertAt = idx + marker.length;
  return `${secureUrl.slice(0, insertAt)}w_${width},f_auto,q_auto/${secureUrl.slice(insertAt)}`;
}

export default cloudinary;

import sharp from 'sharp';
import { encode } from 'blurhash';

/** Downsamples the image to a tiny raw RGBA buffer and encodes a BlurHash
 * string from it, used as a loading placeholder before the real (Cloudinary)
 * image loads on the client. */
export async function encodeBlurHash(buffer: Buffer): Promise<string | null> {
  try {
    const { data, info } = await sharp(buffer)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
  } catch {
    return null;
  }
}

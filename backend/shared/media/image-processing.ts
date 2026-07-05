import sharp from 'sharp';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';

export const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 1600;

export interface ProcessedImage {
	data: Buffer;
	mimeType: string;
}

/**
 * Validates and processes an uploaded image before it's persisted. Shared by
 * every service that stores user-uploaded images (posts, chat) so the
 * security/format policy only lives in one place:
 * - sniffs the real file type from magic bytes (never trusts a declared
 *   Content-Type, which is trivial to spoof) against a strict allowlist
 *   that explicitly excludes SVG (a classic stored-XSS vector).
 * - re-encodes to WebP, capped at IMAGE_MAX_DIMENSION, which both bounds
 *   storage/bandwidth and strips EXIF metadata (privacy — many photos
 *   embed GPS coordinates).
 */
export const processImage = async (base64: string): Promise<ProcessedImage> => {
	const raw = Buffer.from(base64, 'base64');
	if (raw.length === 0) {
		throw Object.assign(new Error('Imagen vacía'), { statusCode: 400 });
	}
	if (raw.length > MAX_IMAGE_BYTES) {
		throw Object.assign(new Error('La imagen supera el tamaño máximo permitido (8MB)'), { statusCode: 400 });
	}

	const detected = await fileTypeFromBuffer(raw);
	if (!detected || !ALLOWED_IMAGE_MIME_TYPES.has(detected.mime)) {
		throw Object.assign(new Error('Formato de imagen no soportado'), { statusCode: 400 });
	}

	const data = await sharp(raw)
		.rotate()
		.resize({ width: IMAGE_MAX_DIMENSION, height: IMAGE_MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer();

	return { data, mimeType: 'image/webp' };
};

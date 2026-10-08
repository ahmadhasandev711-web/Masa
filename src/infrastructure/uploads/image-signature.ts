export type DetectedImageType = 'jpg' | 'png' | 'webp' | 'avif';

const startsWith = (buffer: Uint8Array, bytes: number[], offset = 0): boolean =>
  bytes.every((byte, index) => buffer[offset + index] === byte);

/**
 * Identifies an image by its file signature instead of trusting the
 * client-declared MIME type. Returns null for anything unrecognized.
 */
export function detectImageType(buffer: Uint8Array): DetectedImageType | null {
  if (buffer.length < 12) return null;
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'webp';
  }
  if (startsWith(buffer, [0x66, 0x74, 0x79, 0x70], 4) && isAvifBrand(buffer)) return 'avif';
  return null;
}

function isAvifBrand(buffer: Uint8Array): boolean {
  const brand = String.fromCharCode(...buffer.slice(8, 12));
  return brand === 'avif' || brand === 'avis';
}

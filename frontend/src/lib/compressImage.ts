// Resizes/re-compresses a photo client-side before upload. Most phone camera
// photos are 3-8MB and far larger than a certificate needs to be legible —
// shrinking here directly conserves Cloudinary's free-tier storage AND
// bandwidth (the same file gets served on every future view), and makes
// uploads noticeably faster on mobile data.
//
// PDFs and already-small images pass through untouched.
export async function compressImageIfNeeded(file: File): Promise<File> {
  const SKIP_BELOW_BYTES = 350 * 1024; // not worth re-compressing small files
  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.82;

  if (!file.type.startsWith('image/') || file.size < SKIP_BELOW_BYTES) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file; // canvas unsupported for some reason — fall back to original

  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  if (!blob || blob.size >= file.size) return file; // only use it if it actually helped

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}

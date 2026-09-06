import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker to load from CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

/**
 * Returns a reliable, high-resolution JPEG image URL of the certificate.
 * If the certificate is a PDF stored on Cloudinary, this applies Cloudinary's
 * `f_jpg,q_auto,pg_1` transformation and `.jpg` extension.
 * This ensures that:
 * 1. The certificate preview NEVER displays a blank grey box.
 * 2. It renders in all standard <img> tags.
 * 3. It bypasses Cloudinary free tier restrictions on raw PDF delivery.
 */
export function getCertificatePreviewUrl(cert: {
  fileUrl: string;
  rawFileUrl?: string;
  fileKind?: string;
}): string {
  if (!cert || !cert.fileUrl) return '';

  const url = cert.fileUrl;
  const isPdf =
    cert.fileKind === 'pdf' ||
    url.toLowerCase().endsWith('.pdf') ||
    url.includes('.pdf?') ||
    url.includes('/pdf/') ||
    (cert.rawFileUrl && cert.rawFileUrl.toLowerCase().endsWith('.pdf'));

  if (isPdf && url.includes('/upload/')) {
    let transformed = url;

    // Apply transformation for page 1 JPEG
    if (!transformed.includes('f_jpg') && !transformed.includes('pg_1')) {
      transformed = transformed.replace('/upload/', '/upload/f_jpg,q_auto,pg_1/');
    }

    // Replace .pdf with .jpg
    transformed = transformed.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
    return transformed;
  }

  return url;
}

/**
 * Renders page 1 of a client-side selected PDF file to a base64 JPEG data URL.
 * Renders with a canvas so users see their actual certificate before uploading,
 * and enables AI vision extraction on PDFs!
 */
export async function renderPdfPageToDataUrl(file: File): Promise<string> {
  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('PDF preview generation timed out')), 3000)
  );

  const renderPromise = (async () => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1.2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D canvas context');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.82);
  })();

  return Promise.race([renderPromise, timeoutPromise]);
}

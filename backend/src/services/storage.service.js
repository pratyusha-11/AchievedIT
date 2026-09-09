const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function uploadFile(buffer, fileKind = 'image') {
  return new Promise((resolve, reject) => {
    // Cloudinary categorizes both images and PDFs under 'image' resource type.
    // This allows PDF page rasterization and authenticated PDF delivery.
    const uploadOptions = {
      folder: 'achievedit/certificates',
      resource_type: 'image',
      timeout: 60000
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

function deleteFile(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

/**
 * Transforms Cloudinary URL for optimized rendering.
 * For PDFs: transforms to page 1 high-resolution JPEG (f_jpg,q_auto,pg_1)
 * so it renders visually inside <img> tags, cards, and previews in all browsers
 * without being blocked by Cloudinary's raw PDF delivery restrictions.
 */
function toOptimizedUrl(secureUrl, fileKind) {
  if (!secureUrl) return '';
  const isPdf = fileKind === 'pdf' || secureUrl.toLowerCase().includes('.pdf');
  if (isPdf) {
    let url = secureUrl.replace('/upload/', '/upload/f_jpg,q_auto,pg_1/');
    return url.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
  }
  return secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
}

/**
 * Generates an authenticated URL for inline PDF viewing (e.g. PDF reader iframe or new tab).
 * Bypasses Cloudinary's default raw delivery ACL restrictions so users never see a 401 error.
 */
function toPdfViewUrl(publicId, fallbackUrl) {
  if (publicId) {
    try {
      return cloudinary.utils.private_download_url(publicId, 'pdf', {
        resource_type: 'image',
        type: 'upload'
      });
    } catch (err) {
      console.warn('Failed to generate private view URL for PDF:', err.message);
    }
  }
  return fallbackUrl || '';
}

/**
 * Generates an authenticated download URL with Content-Disposition: attachment
 * so clicking 'Download' immediately downloads the original PDF file cleanly.
 */
function toPdfDownloadUrl(publicId, fallbackUrl) {
  if (publicId) {
    try {
      return cloudinary.utils.private_download_url(publicId, 'pdf', {
        resource_type: 'image',
        type: 'upload',
        attachment: true
      });
    } catch (err) {
      console.warn('Failed to generate private download URL for PDF:', err.message);
    }
  }
  return fallbackUrl || '';
}

/**
 * Generates an image download URL with Content-Disposition: attachment
 * so clicking 'Download' triggers the save/download file dialog instead of opening in a new tab.
 */
function toImageDownloadUrl(secureUrl, title = 'certificate') {
  if (!secureUrl) return '';
  const safeTitle = (title || 'certificate').replace(/[^a-zA-Z0-9_-]/g, '_');
  if (secureUrl.includes('/upload/')) {
    return secureUrl.replace('/upload/', `/upload/fl_attachment:${safeTitle}/`);
  }
  return secureUrl;
}

module.exports = {
  uploadFile,
  deleteFile,
  toOptimizedUrl,
  toPdfViewUrl,
  toPdfDownloadUrl,
  toImageDownloadUrl
};

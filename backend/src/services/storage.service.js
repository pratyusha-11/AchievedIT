const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function uploadFile(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'achievedit/certificates', resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result))
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

function toPdfDownloadUrl(secureUrl) {
  if (!secureUrl) return '';
  if (secureUrl.toLowerCase().includes('.pdf')) {
    return secureUrl.replace('/upload/', '/upload/fl_attachment/');
  }
  return secureUrl;
}

module.exports = { uploadFile, deleteFile, toOptimizedUrl, toPdfDownloadUrl };

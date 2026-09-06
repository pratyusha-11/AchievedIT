const { v2: cloudinary } = require('cloudinary');
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary categorizes PDFs under its "image" resource type (not "raw") —
// that's what gets them a correct file extension and Content-Type on delivery,
// which is what makes a browser render a PDF inline instead of downloading it.
// "raw" is for arbitrary binary Cloudinary can't otherwise identify — using it
// for PDFs is exactly what causes the "downloads instead of opens" symptom.
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

// Inserts a bandwidth-saving delivery transformation. Real photos get
// f_auto,q_auto (smallest acceptable format+quality per viewer). PDFs only get
// q_auto — deliberately NOT f_auto, since forcing format negotiation on a PDF
// can make Cloudinary serve a rasterized image of page 1 instead of the actual
// PDF, which is the opposite of what "view certificate" should do.
function toOptimizedUrl(secureUrl, fileKind) {
  const transformation = fileKind === 'pdf' ? 'q_auto' : 'f_auto,q_auto';
  return secureUrl.replace('/upload/', `/upload/${transformation}/`);
}

module.exports = { uploadFile, deleteFile, toOptimizedUrl };

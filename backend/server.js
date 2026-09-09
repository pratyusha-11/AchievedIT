const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

require('dotenv').config();

const validateEnv = require('./src/config/env');
validateEnv();

const app = require('./src/app');
const connectDB = require('./src/db/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`AchievedIT API running on port ${PORT}`);
  });

  // Safely normalize any existing PDF certificates in MongoDB so fileUrl displays neatly in Mongo Compass
  (async () => {
    try {
      const certificateModel = require('./src/models/certificate.model');
      const { toOptimizedUrl } = require('./src/services/storage.service');
      const pdfCerts = await certificateModel.find({
        fileKind: 'pdf',
        fileUrl: { $regex: /\.pdf(\?.*)?$/i }
      });
      if (pdfCerts.length > 0) {
        for (const cert of pdfCerts) {
          cert.rawFileUrl = cert.rawFileUrl || cert.fileUrl;
          cert.fileUrl = toOptimizedUrl(cert.fileUrl, 'pdf');
          await cert.save();
        }
        console.log(`Normalized ${pdfCerts.length} PDF certificate(s) for visual preview in MongoDB Compass`);
      }
    } catch (err) {
      console.warn('PDF record normalization note:', err.message);
    }
  })();

  // Let in-flight requests finish instead of dying mid-response on redeploy.
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => process.exit(0));
  });
});

const asyncHandler = require('../utils/asyncHandler');
const { extractCertificateDetails } = require('../services/ai.service');

const extractCertificate = asyncHandler(async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ message: 'AI extraction is not configured on this server' });
  }

  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ message: 'No image provided' });

  // Groq's vision model takes images only — PDFs fall back to manual entry.
  if ((mediaType || '').includes('pdf')) {
    return res.status(400).json({
      message: 'AI extraction currently supports photo certificates only. Please fill this one in manually.'
    });
  }

  try {
    const details = await extractCertificateDetails(image, mediaType);
    res.status(200).json(details);
  } catch (err) {
    console.error('❌ AI Extraction failed:', err.message || err);
    res.status(422).json({
      message: err.message || 'Could not extract details from this image',
      details: err.message
    });
  }
});

module.exports = { extractCertificate };

const certificateModel = require('../models/certificate.model');
const asyncHandler = require('../utils/asyncHandler');
const { uploadFile, deleteFile, toOptimizedUrl, toPdfDownloadUrl } = require('../services/storage.service');

function toPublicCertificate(c) {
  return {
    id: c._id,
    title: c.title,
    organizer: c.organizer,
    eventType: c.eventType,
    mode: c.mode,
    startDate: c.startDate,
    endDate: c.endDate,
    position: c.position,
    domainTags: c.domainTags,
    credentialUrl: c.credentialUrl,
    description: c.description,
    notes: c.notes,
    fileUrl: toOptimizedUrl(c.fileUrl, c.fileKind),
    rawFileUrl: c.fileUrl,
    pdfDownloadUrl: toPdfDownloadUrl(c.fileUrl),
    fileKind: c.fileKind,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };
}

const listCertificates = asyncHandler(async (req, res) => {
  const certificates = await certificateModel
    .find({ user: req.userId })
    .sort({ startDate: -1, createdAt: -1 });

  res.status(200).json({ certificates: certificates.map(toPublicCertificate) });
});

const getCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateModel.findOne({ _id: req.params.id, user: req.userId });
  if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

  res.status(200).json({ certificate: toPublicCertificate(certificate) });
});

const createCertificate = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'A certificate file is required' });

  const { title, organizer } = req.body;
  if (!title || !organizer) {
    return res.status(400).json({ message: 'Title and organizer are required' });
  }

  const fileKind = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
  const uploadResult = await uploadFile(req.file.buffer, fileKind);

  const domainTags = req.body.domainTags
    ? Array.isArray(req.body.domainTags)
      ? req.body.domainTags
      : req.body.domainTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const certificate = await certificateModel.create({
    user: req.userId,
    title: title.trim(),
    organizer: organizer.trim(),
    eventType: req.body.eventType || 'other',
    mode: req.body.mode || 'offline',
    startDate: req.body.startDate || null,
    endDate: req.body.endDate || null,
    position: req.body.position || 'participant',
    domainTags,
    credentialUrl: req.body.credentialUrl || null,
    description: req.body.description || null,
    notes: req.body.notes || null,
    fileUrl: uploadResult.secure_url,
    filePublicId: uploadResult.public_id,
    fileKind: fileKind
  });

  res.status(201).json({ certificate: toPublicCertificate(certificate) });
});

const updateCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateModel.findOne({ _id: req.params.id, user: req.userId });
  if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

  const {
    title,
    organizer,
    eventType,
    mode,
    startDate,
    endDate,
    position,
    domainTags,
    credentialUrl,
    description,
    notes
  } = req.body;

  if (title !== undefined) certificate.title = title.trim();
  if (organizer !== undefined) certificate.organizer = organizer.trim();
  if (eventType !== undefined) certificate.eventType = eventType;
  if (mode !== undefined) certificate.mode = mode;
  if (startDate !== undefined) certificate.startDate = startDate || null;
  if (endDate !== undefined) certificate.endDate = endDate || null;
  if (position !== undefined) certificate.position = position;
  if (credentialUrl !== undefined) certificate.credentialUrl = credentialUrl || null;
  if (description !== undefined) certificate.description = description || null;
  if (notes !== undefined) certificate.notes = notes || null;

  if (domainTags !== undefined) {
    certificate.domainTags = Array.isArray(domainTags)
      ? domainTags
      : typeof domainTags === 'string'
      ? domainTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
  }

  // Handle file replacement if a new file was uploaded
  if (req.file) {
    const oldPublicId = certificate.filePublicId;
    const fileKind = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
    const uploadResult = await uploadFile(req.file.buffer, fileKind);

    certificate.fileUrl = uploadResult.secure_url;
    certificate.filePublicId = uploadResult.public_id;
    certificate.fileKind = fileKind;

    // Delete old file from Cloudinary in background
    if (oldPublicId) {
      deleteFile(oldPublicId).catch((err) => {
        console.warn('Failed to delete old certificate file from Cloudinary:', err.message);
      });
    }
  }

  await certificate.save();
  res.status(200).json({ certificate: toPublicCertificate(certificate) });
});

const deleteCertificate = asyncHandler(async (req, res) => {
  const certificate = await certificateModel.findOne({ _id: req.params.id, user: req.userId });
  if (!certificate) return res.status(404).json({ message: 'Certificate not found' });

  await deleteFile(certificate.filePublicId).catch((err) => {
    console.warn('Failed to delete Cloudinary file:', err.message);
  });
  await certificate.deleteOne();

  res.status(200).json({ message: 'Deleted' });
});

module.exports = {
  listCertificates,
  getCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate
};

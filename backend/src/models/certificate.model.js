const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },
    title: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      enum: ['hackathon', 'workshop', 'competition', 'online_course', 'seminar', 'internship', 'other'],
      default: 'other'
    },
    mode: { type: String, enum: ['online', 'offline'], default: 'offline' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    position: {
      type: String,
      enum: ['winner', 'runner_up', 'finalist', 'participant', 'completion'],
      default: 'participant'
    },
    domainTags: { type: [String], default: [] },
    credentialUrl: { type: String, default: null },
    description: { type: String, default: null },
    notes: { type: String, default: null },
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, required: true },
    // Cloudinary treats both photos and PDFs as its "image" asset type, so this
    // just tracks which kind of file it actually is for our own delivery-URL logic.
    fileKind: { type: String, enum: ['image', 'pdf'], required: true }
  },
  { timestamps: true }
);

// Every list view is "this user's certs, most recent first" — index for it.
certificateSchema.index({ user: 1, startDate: -1 });

const certificateModel = mongoose.model('certificate', certificateSchema);

module.exports = certificateModel;

const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certId: {
    type: String,
    required: true,
    unique: true,
  },
  recipientName: {
    type: String,
    required: true,
  },
  recipientEmail: {
    type: String,
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  issuerName: {
    type: String,
    required: true,
  },
  issuerEmail: {
    type: String,
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  ipfsHash: {
    type: String,
    default: null,
  },
  ipfsUrl: {
    type: String,
    default: null,
  },
  txHash: {
    type: String,
    default: null,
  },
  blockchainAddress: {
    type: String,
    default: null,
  },
  qrCodeUrl: {
    type: String,
    default: null,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  revokeReason: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
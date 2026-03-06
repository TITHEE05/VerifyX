const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { ethers } = require('ethers');

const Certificate = require('../models/Certificate');
const { uploadToIPFS } = require('../utils/pinata');
const { sendCertificateEmail } = require('../utils/mailer');

// Load ABI - update this path if needed
const contractABI = require('C:/Users/Hp/OneDrive/Desktop/VerifyX/BLOCKCHAIN/artifacts/contracts/VerifyX.sol/VerifyX.json').abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signerOrProvider);
}

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.ALCHEMY_URL || 'http://127.0.0.1:8545');
}

function getSigner() {
  const provider = getProvider();
  return new ethers.Wallet(process.env.PRIVATE_KEY, provider);
}

// ─── POST /cert/issue ────────────────────────────────────────────────────────
router.post('/issue', async (req, res) => {
  try {
    const { recipientName, recipientEmail, courseName, issuerName, issuerEmail } = req.body;

    if (!recipientName || !recipientEmail || !courseName || !issuerName || !issuerEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 1. Generate unique certificate ID
    const certId = uuidv4();

    // 2. Build metadata
    const metadata = {
      certId,
      recipientName,
      recipientEmail,
      courseName,
      issuerName,
      issuerEmail,
      issuedAt: new Date().toISOString(),
      platform: 'VerifyX',
    };

    // 3. Upload to IPFS (Pinata)
    let ipfsHash = null;
    let ipfsUrl = null;
    try {
      ({ ipfsHash, ipfsUrl } = await uploadToIPFS(metadata, certId));
      console.log('✅ IPFS Upload:', ipfsHash);
    } catch (ipfsErr) {
      console.warn('⚠️ IPFS upload failed (continuing without it):', ipfsErr.message);
    }

    // 4. Store on blockchain
    let txHash = null;
    try {
      const signer = getSigner();
      const contract = getContract(signer);
      const tx = await contract.issueCertificate(
        certId,
        recipientName,
        courseName,
        issuerName,
        ipfsHash || ''
      );
      const receipt = await tx.wait();
      txHash = receipt.hash;
      console.log('✅ Blockchain TX:', txHash);
    } catch (bcErr) {
      console.warn('⚠️ Blockchain write failed (continuing without it):', bcErr.message);
    }

    // 5. Generate QR code
    const verifyUrl = `${FRONTEND_URL}/verify/${certId}`;
    let qrCodeUrl = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(verifyUrl);
    } catch (qrErr) {
      console.warn('⚠️ QR code generation failed:', qrErr.message);
    }

    // 6. Save to MongoDB
    const certificate = new Certificate({
      certId,
      recipientName,
      recipientEmail,
      courseName,
      issuerName,
      issuerEmail,
      ipfsHash,
      ipfsUrl,
      txHash,
      blockchainAddress: CONTRACT_ADDRESS,
      qrCodeUrl,
    });
    await certificate.save();
    console.log('✅ Saved to MongoDB');

    // 7. Send email to recipient
    try {
      await sendCertificateEmail({
        recipientEmail,
        recipientName,
        certId,
        courseName,
        issuerName,
        qrCodeUrl,
        ipfsUrl,
        verifyUrl,
      });
      console.log('✅ Email sent to', recipientEmail);
    } catch (mailErr) {
      console.warn('⚠️ Email send failed:', mailErr.message);
    }

    res.status(201).json({
      message: 'Certificate issued successfully',
      certId,
      txHash,
      ipfsUrl,
      verifyUrl,
      qrCodeUrl,
    });

  } catch (err) {
    console.error('❌ Issue error:', err);
    res.status(500).json({ error: 'Failed to issue certificate', details: err.message });
  }
});

// ─── GET /cert/verify/:certId ─────────────────────────────────────────────────
// Verify from blockchain
router.get('/verify/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    const provider = getProvider();
    const contract = getContract(provider);

    const result = await contract.verifyCertificate(certId);
    // result depends on your contract's return shape — adjust field names as needed
    res.json({
      valid: result.isValid || true,
      certId,
      recipientName: result.recipientName,
      courseName: result.courseName,
      issuerName: result.issuerName,
      issuedAt: result.issuedAt?.toString(),
      ipfsHash: result.ipfsHash,
      isRevoked: result.isRevoked,
    });
  } catch (err) {
    console.error('❌ Verify error:', err);
    res.status(404).json({ error: 'Certificate not found or invalid', details: err.message });
  }
});

// ─── GET /cert/:certId ────────────────────────────────────────────────────────
// Get full certificate details from MongoDB
router.get('/:certId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certId: req.params.certId });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    res.json(cert);
  } catch (err) {
    console.error('❌ Get cert error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /cert/revoke/:certId ────────────────────────────────────────────────
router.post('/revoke/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    const { reason } = req.body;

    // Revoke on blockchain
    try {
      const signer = getSigner();
      const contract = getContract(signer);
      const tx = await contract.revokeCertificate(certId);
      await tx.wait();
      console.log('✅ Revoked on blockchain');
    } catch (bcErr) {
      console.warn('⚠️ Blockchain revoke failed:', bcErr.message);
    }

    // Update MongoDB
    const cert = await Certificate.findOneAndUpdate(
      { certId },
      { isRevoked: true, revokedAt: new Date(), revokeReason: reason || 'No reason provided' },
      { new: true }
    );

    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    res.json({ message: 'Certificate revoked successfully', certId });
  } catch (err) {
    console.error('❌ Revoke error:', err);
    res.status(500).json({ error: 'Failed to revoke certificate' });
  }
});

module.exports = router;
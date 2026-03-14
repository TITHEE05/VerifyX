const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { ethers } = require('ethers');
const { createCanvas, loadImage } = require('canvas');

const Certificate = require('../models/Certificate');
const { uploadToIPFS } = require('../utils/pinata');
const { sendCertificateEmail } = require('../utils/mailer');

const contractABI = require('C:/Users/Hp/OneDrive/Desktop/VerifyX/BLOCKCHAIN/artifacts/contracts/VerifyX.sol/VerifyX.json').abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const authMiddleware = require("../middleware/auth");

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

/**
 * Generate a professional certificate image as a PNG Buffer
 */
async function generateCertificateImage({ recipientName, courseName, issuerName, certId, issuedAt, qrCodeDataUrl, description, grade, eventName, expiryDate }) {
  const width = 1200;
  const height = 850;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#4F46E5';
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Inner border
  ctx.strokeStyle = '#7C3AED';
  ctx.lineWidth = 3;
  ctx.strokeRect(35, 35, width - 70, height - 70);

  // Header background
  const headerGrad = ctx.createLinearGradient(0, 0, width, 0);
  headerGrad.addColorStop(0, '#4F46E5');
  headerGrad.addColorStop(1, '#7C3AED');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(20, 20, width - 40, 140);

  // VerifyX branding
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VerifyX', width / 2, 95);

  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#c7d2fe';
  ctx.fillText('Blockchain Certificate Verification Platform', width / 2, 135);

  // "Certificate of Completion"
  ctx.fillStyle = '#4F46E5';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Certificate of Completion', width / 2, 240);

  // Decorative line
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 260);
  ctx.lineTo(width - 100, 260);
  ctx.stroke();

  // "This is to certify that"
  ctx.fillStyle = '#6B7280';
  ctx.font = '22px sans-serif';
  ctx.fillText('This is to certify that', width / 2, 320);

  // Recipient name
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(recipientName, width / 2, 410);

  // Underline for name
  const nameWidth = ctx.measureText(recipientName).width;
  ctx.strokeStyle = '#4F46E5';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - nameWidth / 2, 425);
  ctx.lineTo(width / 2 + nameWidth / 2, 425);
  ctx.stroke();

  // "has successfully completed"
  ctx.fillStyle = '#6B7280';
  ctx.font = '22px sans-serif';
  ctx.fillText('has successfully completed', width / 2, 480);

  // Course name
  ctx.fillStyle = '#4F46E5';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(courseName, width / 2, 545);

  // Decorative line
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 580);
  ctx.lineTo(width - 100, 580);
  ctx.stroke();

  // Issuer and date
  const dateStr = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  ctx.fillStyle = '#374151';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Issued by:', 100, 640);
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText(issuerName, 100, 675);

  ctx.fillStyle = '#374151';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Date of Issue:', width / 2, 640);
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText(dateStr, width / 2, 675);

  // Certificate ID
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Certificate ID: ${certId}`, 100, 780);

  // QR Code (bottom right)
  if (qrCodeDataUrl) {
    try {
      const qrImage = await loadImage(qrCodeDataUrl);
      ctx.drawImage(qrImage, width - 230, 600, 180, 180);
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to verify', width - 140, 800);
    } catch (qrErr) {
      console.warn('⚠️ QR embed failed:', qrErr.message);
    }
  }

  // Blockchain verified badge
  ctx.fillStyle = '#D1FAE5';
  ctx.beginPath();
  ctx.roundRect(width - 420, 750, 160, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✅ Blockchain Verified', width - 340, 776);

  return canvas.toBuffer('image/png');
}

// ─── POST /cert/issue ────────────────────────────────────────────────────────
router.post('/issue', authMiddleware, async (req, res) => {
  try {
    const { recipientName, recipientEmail, courseName, issuerName, description, grade, eventName, expiryDate } = req.body;

    if (!recipientName || !recipientEmail || !courseName || !issuerName) {
      return res.status(400).json({ error: 'recipientName, recipientEmail, courseName and issuerName are required' });
    }

    const certId = uuidv4();
    const issuedAt = new Date().toISOString();

    // 1. Build metadata
    const metadata = {
      certId,
      recipientName,
      recipientEmail,
      courseName,
      issuerName,
      description: description || '',
      grade: grade || '',
      eventName: eventName || '',
      expiryDate: expiryDate || null,
      issuedAt,
      platform: 'VerifyX',
    };

    // 2. Upload to IPFS
    let ipfsHash = null;
    let ipfsUrl = null;
    try {
      ({ ipfsHash, ipfsUrl } = await uploadToIPFS(metadata, certId));
      console.log('✅ IPFS Upload:', ipfsHash);
    } catch (ipfsErr) {
      console.warn('⚠️ IPFS upload failed:', ipfsErr.message);
    }

    // 3. Store on blockchain
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
      console.warn('⚠️ Blockchain write failed:', bcErr.message);
    }

    // 4. Generate QR code
    const verifyUrl = `${FRONTEND_URL}/certificate/${certId}`;
    let qrCodeUrl = null;
    try {
      qrCodeUrl = await QRCode.toDataURL(verifyUrl);
    } catch (qrErr) {
      console.warn('⚠️ QR code generation failed:', qrErr.message);
    }

    // 5. Generate certificate image
    let certificateBuffer = null;
    try {
      certificateBuffer = await generateCertificateImage({
        recipientName,
        courseName,
        issuerName,
        certId,
        issuedAt,
        qrCodeDataUrl: qrCodeUrl,
        description: description || '',
        grade: grade || '',
        eventName: eventName || '',
        expiryDate: expiryDate || null,
      });
      console.log('✅ Certificate image generated');
    } catch (imgErr) {
      console.warn('⚠️ Certificate image generation failed:', imgErr.message);
    }

    // 6. Save to MongoDB
    const certificate = new Certificate({
      certId,
      recipientName,
      recipientEmail,
      courseName,
      issuerName,
      description: description || '',
      grade: grade || '',
      eventName: eventName || '',
      expiryDate: expiryDate || null,
      ipfsHash,
      ipfsUrl,
      txHash,
      blockchainAddress: CONTRACT_ADDRESS,
      qrCodeUrl,
    });
    await certificate.save();
    console.log('✅ Saved to MongoDB');

    // 7. Send email with certificate attachment
    try {
      await sendCertificateEmail({
        recipientEmail,
        recipientName,
        certId,
        courseName,
        issuerName,
        ipfsUrl,
        certificateBuffer,
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
router.get('/verify/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    const provider = getProvider();
    const contract = getContract(provider);

    const result = await contract.verifyCertificate(certId);
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

// ─── GET /cert/all ────────────────────────────────────────────────────────────
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const certificates = await Certificate.find().sort({ createdAt: -1 });

    // Auto-expire check for all certificates
    for (const cert of certificates) {
      if (cert.expiryDate && new Date() > new Date(cert.expiryDate) && !cert.isRevoked) {
        cert.isRevoked = true;
        cert.revokeReason = "Certificate expired automatically";
        cert.revokedAt = new Date();
        await cert.save();
        console.log(`⏰ Auto-expired: ${cert.certId}`);
      }
    }

    res.json({ certificates });
  } catch (err) {
    console.error('❌ Get all error:', err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// ─── GET /cert/:certId ────────────────────────────────────────────────────────
router.get('/:certId', async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certId: req.params.certId });
    
    // If not in MongoDB — try blockchain
    if (!cert) {
      try {
        const provider = getProvider();
        const contract = getContract(provider);
        const result = await contract.verifyCertificate(req.params.certId);
        
        // If found on blockchain return basic data
        if (result && result.recipientName) {
          return res.json({
            certId: req.params.certId,
            recipientName: result.recipientName,
            courseName: result.courseName,
            issuerName: result.issuerName,
            isRevoked: !result.isValid,
            txHash: null,
            ipfsHash: result.ipfsHash,
            ipfsUrl: result.ipfsHash 
              ? `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}` 
              : null,
            source: "blockchain" // flag that this came from blockchain
          });
        }
      } catch (bcErr) {
        console.warn('Blockchain fallback failed:', bcErr.message);
      }
      
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Auto expiry check
    if (cert.expiryDate && new Date() > new Date(cert.expiryDate) && !cert.isRevoked) {
      cert.isRevoked = true;
      cert.revokeReason = "Certificate expired automatically";
      cert.revokedAt = new Date();
      await cert.save();
    }

    res.json(cert);
  } catch (err) {
    console.error('❌ Get cert error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /cert/revoke/:certId ────────────────────────────────────────────────
router.post('/revoke/:certId', authMiddleware, async (req, res) => {
  try {
    const { certId } = req.params;
    const { reason } = req.body;

    try {
      const signer = getSigner();
      const contract = getContract(signer);
      const tx = await contract.revokeCertificate(certId);
      await tx.wait();
      console.log('✅ Revoked on blockchain');
    } catch (bcErr) {
      console.warn('⚠️ Blockchain revoke failed:', bcErr.message);
    }

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
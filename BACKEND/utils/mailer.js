const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send certificate issued email to recipient
 */
async function sendCertificateEmail({ recipientEmail, recipientName, certId, courseName, issuerName, qrCodeUrl, ipfsUrl, verifyUrl }) {
  await transporter.sendMail({
    from: `"VerifyX Certificates" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `🎓 Your Certificate for "${courseName}" is Ready!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎓 VerifyX Certificate</h1>
        </div>
        <div style="padding: 32px;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>Congratulations! Your certificate for <strong>"${courseName}"</strong> has been issued by <strong>${issuerName}</strong> and recorded on the blockchain.</p>

          <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #6B7280;">Certificate ID</p>
            <p style="margin: 4px 0 0; font-family: monospace; font-size: 15px; color: #111827;">${certId}</p>
          </div>

          <p>Scan the QR code below or click the button to verify your certificate:</p>

          ${qrCodeUrl ? `<div style="text-align:center; margin: 16px 0;"><img src="${qrCodeUrl}" alt="QR Code" width="160" height="160"/></div>` : ''}

          <div style="text-align: center; margin: 24px 0;">
            <a href="${verifyUrl}" style="background: #4F46E5; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Verify Certificate
            </a>
          </div>

          ${ipfsUrl ? `<p style="font-size: 12px; color: #9CA3AF;">IPFS Backup: <a href="${ipfsUrl}">${ipfsUrl}</a></p>` : ''}

          <p style="color: #6B7280; font-size: 13px; margin-top: 32px;">This certificate is permanently recorded on the blockchain and cannot be tampered with.</p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendCertificateEmail };
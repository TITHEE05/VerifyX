const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const Organization = require("../models/Organization");

// In-memory OTP store
const otpStore = {};

// ── Transporter ──
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── POST /auth/send-otp ──
router.post("/send-otp", async (req, res) => {
  const { email, orgName } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore[email] = { otp, expiresAt, orgName: orgName || "" };

  try {
    await transporter.sendMail({
      from: `"VerifyX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your VerifyX Login Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2af598;">Your VerifyX OTP</h2>
          <p>Use this code to log in. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; 
                      background: #f4f4f4; padding: 20px; text-align: center; 
                      border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ── POST /auth/verify-otp ──
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required" });

  const record = otpStore[email];
  if (!record) return res.status(400).json({ error: "No OTP requested for this email" });
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }
  if (record.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  // OTP valid — delete it
  delete otpStore[email];

  try {
    // Find or create organization in DB
    let org = await Organization.findOne({ email });
    if (!org) {
      org = await Organization.create({
        email,
        orgName: record.orgName || email.split("@")[0],
      });
    }

    // Issue JWT
    const token = jwt.sign(
      { orgId: org._id, email: org.email, orgName: org.orgName },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "OTP verified successfully",
      token,
      organization: {
        orgId:   org._id,
        orgName: org.orgName,
        email:   org.email,
      },
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
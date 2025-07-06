const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Guard = require("../models/SecurityGuard");

// const Frontend_URL_Guard = "https://localhost:3000/"; // Change this to your frontend URL
const Frontend_URL_Guard = "https://security-module-chi.vercel.app"; // Change this to your frontend URL

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Login route
router.post("/guard-login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const guard = await Guard.findOne({ email, role: "security" }).populate(
      "society",
      "name"
    ); // Populate society name
    if (!guard)
      return res.status(401).json({ message: "Invalid email or role" });
    const isMatch = await guard.comparePassword(password);
    //     console.log("Password entered:", password);
    // console.log("Password hash stored:", guard.password);
    // console.log("Is Match:", isMatch);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign(
      {
        id: guard._id,
        email: guard.email,
        role: guard.role,
        society: guard.society?._id,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      email: guard.email,
      society: guard.society,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Registration route
router.post("/guard-register", async (req, res) => {
  const { email, password, society } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(society)) {
      return res.status(400).json({ message: "Invalid society ID" });
    }

    const existingGuard = await Guard.findOne({ email });
    if (existingGuard)
      return res.status(400).json({ message: "Email already exists" });

    const guard = new Guard({
      email,
      password,
      society,
      role: "security",
    });
    await guard.save();
    res.status(201).json({ message: "Security guard registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Profile route
router.get("/guard-profile", authenticateToken, async (req, res) => {
  try {
    const guard = await Guard.findById(req.user.id)
      .select("-password")
      .populate("society", "name flats");
    if (!guard) return res.status(404).json({ message: "Guard not found" });
    res.json({
      email: guard.email,
      role: guard.role,
      society: guard.society,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", (req, res) => {
  res.send("Security Guard Backend is running");
});

const JWT_SECRET = "DEC-Security"; // put in .env
const RESET_TOKEN_EXPIRY_MINUTES = 15; // Token valid for 15 minutes

// Setup email transporter (use your real email service)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "jbsecond2004@gmail.com",
    pass: "tvlf bceb jtxw fiic",
  },
});

// 1. Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const guard = await Guard.findOne({ email });
    if (!guard) return res.status(404).json({ message: "Guard not found" });

    const resetToken = jwt.sign({ id: guard._id }, JWT_SECRET, {
      expiresIn: `${RESET_TOKEN_EXPIRY_MINUTES}m`,
    });

    guard.resetPasswordToken = resetToken;
    guard.resetPasswordExpire =
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000; // 15 min
    await guard.save();

    const resetUrl = `${Frontend_URL_Guard}/security/reset-password/${resetToken}`; // Frontend URL

    await transporter.sendMail({
      from: "your_email@gmail.com",
      to: guard.email,
      subject: "Password Reset Request",
      html: `
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your password. This link expires in ${RESET_TOKEN_EXPIRY_MINUTES} minutes:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    });

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Reset Password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const guard = await Guard.findById(decoded.id);

    if (
      !guard ||
      guard.resetPasswordToken !== token ||
      guard.resetPasswordExpire < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // In your reset password route
    // const salt = await bcrypt.genSalt(10);
    // guard.password = await bcrypt.hash(req.body.newPassword, salt);  // 👈 hash newPassword directly
    // console.log("New Password Hash:", guard.password); // Log the new password hash
    guard.password = newPassword;
    guard.resetPasswordToken = undefined;
    guard.resetPasswordExpire = undefined;
    await guard.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token." });
  }
});

module.exports = router;
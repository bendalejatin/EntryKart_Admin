const express = require("express");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const router = express.Router();

const SECRET_KEY = "DEC-GAMING"; // Change this to a secure key

// Signup – if email is "dec@gmail.com", set role to superadmin.
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required!" });
    }
    const role = email === "dec@gmail.com" ? "superadmin" : "admin";
    const existing = await Admin.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Admin already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
    });
    await newAdmin.save();
    res
      .status(201)
      .json({ message: "Admin registered successfully", email, role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login – simple check; returns full admin details.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Invalid credentials" });
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid)
      return res.status(400).json({ message: "Invalid credentials" });
    // Generate JWT token
    const token = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, SECRET_KEY, { expiresIn: "1h" });
    
    res.json({
      message: "Login successful",
      email: admin.email,
      role: admin.role,
      name: admin.name,
      phone: admin.phone,
      image: admin.image,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// // ✅ Middleware to verify JWT token
// const verifyToken = (req, res, next) => {
//   const token = req.header("Authorization");
//   if (!token) return res.status(403).json({ message: "Access denied. No token provided." });

//   try {
//     const verified = jwt.verify(token.split(" ")[1], SECRET_KEY);
//     req.admin = verified;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Invalid token. Please log in again." });
//   }
// };

// Get Profile – fetch admin info by email
router.get("/profile", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Profile
router.put("/update", async (req, res) => {
  try {
    const { email, name, phone, image } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update fields if provided
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (image) {
      // Validate image (e.g., ensure it's a valid Base64 string)
      if (image.startsWith("data:image/")) {
        // Optionally, check size (e.g., < 5MB)
        const base64Data = image.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        if (buffer.length > 5 * 1024 * 1024) {
          return res
            .status(413)
            .json({ message: "Image size must be less than 5MB" });
        }
        admin.image = image;
      } else {
        return res.status(400).json({ message: "Invalid image format" });
      }
    }

    await admin.save();
    res.json({
      message: "Profile updated successfully",
      admin: {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        image: admin.image,
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error.message);
    res
      .status(500)
      .json({ message: `Failed to update profile: ${error.message}` });
  }
});


// 🟢 Dummy Email Transporter (For Testing)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jbsecond2004@gmail.com", // ✅ Replace with your email
    pass: "xvijebuygvadpndv" // ✅ Replace with your email password
  }
});

// ✅ Step 1: Request Password Reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Generate Reset Token (Valid for 15 mins)
    const resetToken = jwt.sign({ id: admin._id }, SECRET_KEY, { expiresIn: "15m" });

    // Send Reset Email
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: "jbsecond2004@gmail.com",
      to: admin.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    res.status(500).json({ message: "Error sending reset email", error: error.message });
  }
});

// ✅ Step 2: Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify Token
    const decoded = jwt.verify(token, SECRET_KEY);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Invalid or expired token", error: error.message });
  }
});



module.exports = router;

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const SecurityGuard = require("../models/SecurityGuard");

const JWT_SECRET = process.env.JWT_SECRET || "DEC";

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
    const guard = await SecurityGuard.findOne({ email, role: "security" });
    if (!guard) return res.status(401).json({ message: "Invalid email or role" });
    const isMatch = await guard.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });
    const token = jwt.sign(
      { id: guard._id, email: guard.email, role: guard.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token, email: guard.email });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Registration route
router.post("/guard-register", async (req, res) => {
  const { email, password, societyId } = req.body;
  try {
    const existingGuard = await SecurityGuard.findOne({ email });
    if (existingGuard) return res.status(400).json({ message: "Email already exists" });

    const guard = new SecurityGuard({
      email,
      password,
      society: societyId,
    });

    await guard.save();
    res.status(201).json({ message: "Security guard registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
});

// Profile route
// Profile route
router.get("/guard-profile", authenticateToken, async (req, res) => {
  try {
    const guard = await SecurityGuard.findById(req.user.id)
      .select("-password") // Exclude password
      .populate("society", "name"); // Populate society with its 'name' field (adjust based on your Society schema)
    if (!guard) return res.status(404).json({ message: "Guard not found" });
    res.json({
      email: guard.email,
      role: guard.role,
      society: guard.society, // Will include populated society details (e.g., { _id, name })
      createdAt: guard.createdAt,
      updatedAt: guard.updatedAt,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Society = require("../models/Society");
const FlatOwner = require("../models/FlatOwner");
const Admin = require("../models/Admin");

// POST /api/users/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Contact the society admin for login" });
    }

    if (!user.password) {
      // First-time password setup
      user.password = password;
      await user.save();
      return res.status(200).json({ message: "Password set successfully!" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    res.status(200).json({ message: "Login successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create User – expects adminEmail in request body.
router.post("/", async (req, res) => {
  try {
    const { name, flatNumber, societyId, email, phone, adminEmail } = req.body;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const society = await Society.findById(societyId);
    if (!society) return res.status(404).json({ message: "Society not found" });
    const user = new User({
      name,
      flatNumber,
      society: societyId,
      email,
      phone,
      adminEmail,
    });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Users – filter by adminEmail (populate society info)
router.get("/", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    let users;
    if (admin && admin.role === "superadmin") {
      users = await User.find().populate("society");
    } else {
      users = await User.find({ adminEmail }).populate("society");
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Count Users for Dashboard
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    const count =
      admin && admin.role === "superadmin"
        ? await User.countDocuments()
        : await User.countDocuments({ adminEmail });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update User
router.put("/:id", async (req, res) => {
  try {
    const { name, email, flatNumber, phone, societyId } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, flatNumber, phone, society: societyId },
      { new: true }
    );
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete User and corresponding FlatOwner record
router.delete("/:id", async (req, res) => {
  try {
    // Retrieve the user first.
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete the user.
    await User.findByIdAndDelete(req.params.id);

    // Use the society info to remove matching FlatOwner record.
    const society = await Society.findById(user.society);
    if (society) {
      await FlatOwner.findOneAndDelete({
        societyName: society.name,
        flatNumber: user.flatNumber,
      });
    }

    res.json({ message: "User and corresponding owner deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

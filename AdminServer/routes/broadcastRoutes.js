const express = require("express");
const router = express.Router();
const BroadcastMessage = require("../models/BroadcastMessage");
const Admin = require("../models/Admin");
const User = require("../models/User");

router.get("/user", async (req, res) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const broadcasts = await BroadcastMessage.find({
      $or: [
        { broadcastType: "all" }, // All users
        { broadcastType: "society", society: user.society }, // User's society
        {
          broadcastType: "specific",
          society: user.society,
          flatNo: user.flatNumber,
        }, // User's society and flat
      ],
    }).sort({ createdAt: -1 }); // Latest first
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create a new broadcast message (unchanged)
router.post("/", async (req, res) => {
  try {
    const { message, broadcastType, society, flatNo, adminEmail } = req.body;
    if (!message || !broadcastType || !adminEmail) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    if (broadcastType === "specific" && (!society || !flatNo)) {
      return res
        .status(400)
        .json({
          message: "Society and Flat No are required for specific broadcast",
        });
    }
    if (broadcastType === "society" && !society) {
      return res
        .status(400)
        .json({ message: "Society is required for society-wide broadcast" });
    }
    const newBroadcast = new BroadcastMessage({
      message,
      broadcastType,
      society: society || null,
      flatNo: flatNo || null,
      adminEmail,
    });
    await newBroadcast.save();
    res.status(201).json(newBroadcast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Retrieve broadcast messages filtered by adminEmail (unchanged)
router.get("/", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    let broadcasts;
    if (admin && admin.role === "superadmin") {
      broadcasts = await BroadcastMessage.find().populate("society");
    } else {
      broadcasts = await BroadcastMessage.find({ adminEmail }).populate(
        "society"
      );
    }
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NEW GET: Retrieve broadcast messages for a specific user
router.get("/user", async (req, res) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.status(400).json({ message: "User email is required" });
    }
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const broadcasts = await BroadcastMessage.find({
      $or: [
        { broadcastType: "all" }, // All users get this
        { broadcastType: "society", society: user.society }, // Matches user's society
        {
          broadcastType: "specific",
          society: user.society,
          flatNo: user.flatNumber,
        }, // Matches society and flat
      ],
    }).sort({ createdAt: -1 }); // Latest messages first
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Other existing routes (unchanged)
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    let count;
    if (admin && admin.role === "superadmin") {
      count = await BroadcastMessage.countDocuments();
    } else {
      count = await BroadcastMessage.countDocuments({ adminEmail });
    }
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { message, broadcastType, society, flatNo } = req.body;
    const updatedBroadcast = await BroadcastMessage.findByIdAndUpdate(
      req.params.id,
      {
        message,
        broadcastType,
        society: society || null,
        flatNo: flatNo || null,
      },
      { new: true }
    );
    if (!updatedBroadcast) {
      return res.status(404).json({ message: "Broadcast message not found" });
    }
    res.json(updatedBroadcast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await BroadcastMessage.findByIdAndDelete(req.params.id);
    res.json({ message: "Broadcast message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

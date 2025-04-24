const express = require("express");
const router = express.Router();
const Society = require("../models/Society");
const Coupon = require("../models/Coupon");
const Event = require("../models/Event");
const User = require("../models/User");
const Admin = require("../models/Admin");

// ✅ Get Dashboard Counts
router.get("/stats", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });

    const admin = await Admin.findOne({ email: adminEmail });

    // Superadmin sees all data, others see only their own
    const filter = admin.role === "superadmin" ? {} : { adminEmail };

    const [societyCount, userCount, couponCount, eventCount] =
      await Promise.all([
        Society.countDocuments(filter),
        User.countDocuments(filter),
        Coupon.countDocuments(filter),
        Event.countDocuments(filter),
      ]);

    res.json({
      societies: societyCount,
      users: userCount,
      coupons: couponCount,
      events: eventCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon");
const Admin = require("../models/Admin");
const User = require("../models/User");
const QRCode = require("qrcode");

// Helper function to generate a unique coupon code
const generateUniqueCode = async (baseCode) => {
  let uniqueCode = baseCode;
  let exists = await Coupon.findOne({ code: uniqueCode });
  while (exists) {
    uniqueCode = `${baseCode}-${Math.floor(Math.random() * 10000)}`;
    exists = await Coupon.findOne({ code: uniqueCode });
  }
  return uniqueCode;
};

// Create Coupon – supports single coupon or all flats generation.
router.post("/", async (req, res) => {
  try {
    const {
      societyId,
      flatNo,
      userName,
      code,
      expiryDate,
      eventId,
      adminEmail,
      generateForAllFlats,
      flats,
    } = req.body;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    if (!societyId || !eventId)
      return res
        .status(400)
        .json({ message: "Both societyId and eventId are required" });

    if (generateForAllFlats) {
      if (!flats || !Array.isArray(flats) || flats.length === 0) {
        return res
          .status(400)
          .json({
            message: "Flats array is required for generating all flats coupons",
          });
      }
      let couponsArray = [];
      for (let flat of flats) {
        const userObj = await User.findOne({
          society: societyId,
          flatNumber: flat,
        });
        const foundUserName = userObj ? userObj.name : "";
        const baseCode = `${code}-${flat.replace(/\s+/g, "")}`;
        const uniqueCode = await generateUniqueCode(baseCode);
        const couponData = new Coupon({
          society: societyId,
          flatNo: flat,
          userName: foundUserName,
          code: uniqueCode,
          expiryDate,
          event: eventId,
          adminEmail,
          status: "active",
          used: false,
        });
        const couponObj = await couponData.save();
        const qrData = JSON.stringify({
          couponId: couponObj._id,
          code: couponObj.code,
          flatNo: couponObj.flatNo,
          userName: couponObj.userName,
          status: couponObj.status,
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);
        couponObj.qrCode = qrCodeDataUrl;
        await couponObj.save();
        // console.log(`Generated QR for coupon ${couponObj.code}: ${qrCodeDataUrl.substring(0, 50)}...`);
        couponsArray.push(couponObj);
      }
      return res.status(201).json(couponsArray);
    } else {
      const baseCode = code;
      const uniqueCode = await generateUniqueCode(baseCode);
      const coupon = new Coupon({
        society: societyId,
        flatNo,
        userName,
        code: uniqueCode,
        expiryDate,
        event: eventId,
        adminEmail,
        status: "active",
        used: false,
      });
      const couponObj = await coupon.save();
      const qrData = JSON.stringify({
        couponId: couponObj._id,
        code: couponObj.code,
        flatNo: couponObj.flatNo,
        userName: couponObj.userName,
        status: couponObj.status,
      });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      couponObj.qrCode = qrCodeDataUrl;
      await couponObj.save();
      // console.log(`Generated QR for coupon ${couponObj.code}: ${qrCodeDataUrl.substring(0, 50)}...`);
      res.status(201).json(couponObj);
    }
  } catch (error) {
    console.error("Error creating coupon:", error); // Debug log
    res.status(500).json({ message: error.message });
  }
});

// Update Coupon
router.put("/:id", async (req, res) => {
  try {
    const {
      societyId,
      flatNo,
      userName,
      code,
      expiryDate,
      eventId,
      adminEmail,
    } = req.body;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        society: societyId,
        flatNo,
        userName,
        code,
        expiryDate,
        event: eventId,
        adminEmail,
      },
      { new: true }
    );
    if (!updatedCoupon)
      return res.status(404).json({ message: "Coupon not found" });
    // console.log(`Updated coupon ${updatedCoupon.code}`); // Debug log
    res.json(updatedCoupon);
  } catch (error) {
    // console.error("Error updating coupon:", error); // Debug log
    res.status(500).json({ message: error.message });
  }
});

// Delete Coupon
router.delete("/:id", async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon)
      return res.status(404).json({ message: "Coupon not found" });
    // console.log(`Deleted coupon ${deletedCoupon.code}`); // Debug log
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    // console.error("Error deleting coupon:", error); // Debug log
    res.status(500).json({ message: error.message });
  }
});

// Get Coupons for Dashboard
router.get("/", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    let coupons;
    if (admin && admin.role === "superadmin") {
      coupons = await Coupon.find().populate("society event");
    } else {
      coupons = await Coupon.find({ adminEmail }).populate("society event");
    }
    // console.log(`Fetched ${coupons.length} coupons for ${adminEmail}`); // Debug log
    res.json(coupons);
  } catch (error) {
    // console.error("Error fetching coupons:", error); // Debug log
    res.status(500).json({ message: error.message });
  }
});

// Count Coupons for Dashboard.
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const admin = await Admin.findOne({ email: adminEmail });
    const count =
      admin && admin.role === "superadmin"
        ? await Coupon.countDocuments()
        : await Coupon.countDocuments({ adminEmail });
    // console.log(`Coupon count for ${adminEmail}: ${count}`); // Debug log
    res.json({ count });
  } catch (error) {
    // console.error("Error counting coupons:", error); // Debug log
    res.status(500).json({ message: error.message });
  }
});

// Get Coupons for a specific user
router.get("/user", async (req, res) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail)
      return res.status(400).json({ message: "User email is required" });

    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    const coupons = await Coupon.find({
      society: user.society,
      flatNo: user.flatNumber,
    }).populate("society event");

    res.json(coupons);
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    res.status(500).json({ message: error.message });
  }
});

// Mobile scan endpoint – called automatically when a mobile QR scanner opens the URL.
// This updates the coupon's status to "used" (if not expired).
router.get("/scan/mobile/:code", async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code }).populate(
      "society event"
    );
    if (!coupon) return res.status(404).json({ coupon: null });
    const today = new Date().toISOString().split("T")[0];
    if (coupon.expiryDate < today) {
      coupon.status = "expired";
      await coupon.save();
      // console.log(`Coupon ${coupon.code} is expired`);
      return res.json({
        coupon: {
          qrCodeId: coupon._id,
          code: coupon.code,
          userName: coupon.userName,
          flatNo: coupon.flatNo,
          society: coupon.society ? coupon.society.name : "",
          event: coupon.event ? coupon.event.title : "",
          expiryDate: coupon.expiryDate,
          status: coupon.status,
          used: coupon.used ? "Yes" : "No",
          active: coupon.status === "active" ? "Yes" : "No",
        },
      });
    }
    if (!coupon.used) {
      coupon.used = true;
      coupon.status = "used";
      await coupon.save();
      // console.log(`Coupon ${coupon.code} marked as used`);
      return res.json({
        coupon: {
          qrCodeId: coupon._id,
          code: coupon.code,
          userName: coupon.userName,
          flatNo: coupon.flatNo,
          society: coupon.society ? coupon.society.name : "",
          event: coupon.event ? coupon.event.title : "",
          expiryDate: coupon.expiryDate,
          status: "used",
          used: "Yes",
          active: "No",
          firstScan: true,
        },
      });
    } else {
      // console.log(`Coupon ${coupon.code} already used`);
      return res.json({
        coupon: {
          qrCodeId: coupon._id,
          code: coupon.code,
          userName: coupon.userName,
          flatNo: coupon.flatNo,
          society: coupon.society ? coupon.society.name : "",
          event: coupon.event ? coupon.event.title : "",
          expiryDate: coupon.expiryDate,
          status: coupon.status,
          used: "Yes",
          active: "No",
        },
      });
    }
  } catch (error) {
    console.error("Error scanning coupon:", error); // Debug log
    return res.status(500).json({ message: error.message });
  }
});

// Manual scan endpoint – returns coupon details without updating its status.
router.get("/scan/manual/:code", async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ code: req.params.code }).populate(
      "society event"
    );
    if (!coupon) return res.status(404).json({ coupon: null });
    const today = new Date().toISOString().split("T")[0];
    if (coupon.expiryDate < today) {
      coupon.status = "expired";
      await coupon.save();
      // console.log(`Coupon ${coupon.code} is expired (manual scan)`);
    }
    // console.log(`Manual scan for coupon ${coupon.code}`);
    return res.json({
      coupon: {
        qrCodeId: coupon._id,
        code: coupon.code,
        userName: coupon.userName,
        flatNo: coupon.flatNo,
        society: coupon.society ? coupon.society.name : "",
        event: coupon.event ? coupon.event.title : "",
        expiryDate: coupon.expiryDate,
        status: coupon.status,
        used: coupon.used ? "Yes" : "No",
        active: coupon.status === "active" ? "Yes" : "No",
      },
    });
  } catch (error) {
    console.error("Error in manual scan:", error); // Debug log
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;

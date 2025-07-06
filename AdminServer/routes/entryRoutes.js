const express = require("express");
const Entry = require("../models/Entry");
const Admin = require("../models/Admin");
const router = express.Router();
const cron = require("node-cron");

// Helper: Returns a filter based on the admin's role
const getAdminAndFilterEntries = async (adminEmail) => {
  if (!adminEmail) throw new Error("Admin email is required");
  const admin = await Admin.findOne({ email: adminEmail });
  if (!admin) throw new Error("Admin not found");
  return admin.role === "superadmin" ? {} : { adminEmail };
};

// GET Entry Count
router.get("/count", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: "Admin email is required" });
    }

    const admin = await Admin.findOne({ email });
    let filter = {};
    if (admin && admin.role !== "superadmin") {
      filter = { adminEmail: email };
    }

    const count = await Entry.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Entry
router.post("/", async (req, res) => {
  try {
    const {
      name,
      flatNumber,
      societyId,
      visitorType,
      status,
      dateTime,
      description,
      additionalDateTime,
      adminEmail,
      email,
    } = req.body;

    if (!adminEmail || !societyId || !status) {
      return res
        .status(400)
        .json({ error: "Admin email, society ID, and status are required" });
    }

    const validStatuses = ["pending", "allow", "deny"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          error: "Invalid status value. Must be pending, allow, or deny",
        });
    }

    const expirationDateTime = new Date(dateTime);
    expirationDateTime.setDate(expirationDateTime.getDate() + 7);

    const newEntry = new Entry({
      name,
      flatNumber,
      societyId,
      visitorType,
      status,
      dateTime: new Date(dateTime),
      description,
      additionalDateTime: new Date(additionalDateTime),
      expirationDateTime,
      adminEmail,
      email,
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Entries (filtering by name, flatNumber, date, status, userEmail, and admin ownership)
router.get("/", async (req, res) => {
  try {
    const { name, flatNumber, date, status, email, userEmail } = req.query;
    let query = {};

    if (name) query.name = new RegExp(name, "i");
    if (flatNumber) query.flatNumber = new RegExp(flatNumber, "i");
    if (date) query.dateTime = { $regex: date, $options: "i" };
    if (status) query.status = status;
    if (userEmail) query.email = userEmail;
    if (email) {
      const adminFilter = await getAdminAndFilterEntries(email);
      query = { ...query, ...adminFilter };
    }

    const entries = await Entry.find(query).populate("societyId", "name");
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Entry
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      flatNumber,
      societyId,
      visitorType,
      status,
      dateTime,
      description,
      additionalDateTime,
      adminEmail,
      email,
    } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ["pending", "allow", "deny"];
      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json({
            error: "Invalid status value. Must be pending, allow, or deny",
          });
      }
    }

    // Prepare update object with all fields from the request
    const updateData = {};
    if (name) updateData.name = name;
    if (flatNumber) updateData.flatNumber = flatNumber;
    if (societyId) updateData.societyId = societyId;
    if (visitorType) updateData.visitorType = visitorType;
    if (status) updateData.status = status;
    if (dateTime) updateData.dateTime = new Date(dateTime);
    if (description) updateData.description = description;
    if (additionalDateTime) updateData.additionalDateTime = new Date(additionalDateTime);
    if (adminEmail) updateData.adminEmail = adminEmail;
    if (email) updateData.email = email;

    // Recalculate expirationDateTime if dateTime is provided
    if (dateTime) {
      const expirationDateTime = new Date(dateTime);
      expirationDateTime.setDate(expirationDateTime.getDate() + 7);
      updateData.expirationDateTime = expirationDateTime;
    }

    const updatedEntry = await Entry.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.status(200).json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Entry
router.delete("/:id", async (req, res) => {
  try {
    const deletedEntry = await Entry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json({ message: "Entry deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cron Job: Mark entries as expired (runs daily at midnight)
cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  await Entry.updateMany(
    { expirationDateTime: { $lt: now } },
    { expired: true }
  );
  console.log("Expired permissions updated");
});

// Get Expiring Soon Entries (notify 3 days before expiry)
router.get("/expiring-soon", async (req, res) => {
  try {
    const now = new Date();
    const upcomingExpiration = new Date();
    upcomingExpiration.setDate(now.getDate() + 3);

    const expiringEntries = await Entry.find({
      expirationDateTime: { $gte: now, $lte: upcomingExpiration },
      expired: false,
    });

    res.json(expiringEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
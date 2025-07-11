const express = require("express");
const Entry = require("../models/Entry");
const Admin = require("../models/Admin");
const SecurityGuard = require("../models/SecurityGuard");
const router = express.Router();
const cron = require("node-cron");

// Helper: Returns a filter based on the user's role
const getUserAndFilterEntries = async (email) => {
  if (!email) {
    return {}; // Allow superadmin to fetch all entries
  }

  // Check Admin collection for superadmin
  const admin = await Admin.findOne({ email });
  if (admin && admin.role === "superadmin") {
    return {}; // Superadmin can view all entries
  }

  // Check SecurityGuard collection
  const guard = await SecurityGuard.findOne({ email });
  if (!guard && !admin) throw new Error("User not found");
  return { adminEmail: email }; // Guard or non-superadmin can view their own entries
};

// GET Entry Count
router.get("/count", async (req, res) => {
  try {
    const filter = await getUserAndFilterEntries(req.query.email);
    const count = await Entry.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching entry count:", error);
    res.status(500).json({ message: error.message });
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

    // Validate required fields
    if (!adminEmail || !societyId || !name || !flatNumber || !visitorType || !status || !dateTime || !description || !additionalDateTime) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const validStatuses = ["pending", "allow", "deny"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Must be 'pending', 'allow', or 'deny'" });
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
    console.error("Error creating entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get All Entries
router.get("/", async (req, res) => {
  try {
    const { name, flatNumber, date, status, email, userEmail } = req.query;
    let query = {};

    if (name) query.name = new RegExp(name, "i");
    if (flatNumber) query.flatNumber = new RegExp(flatNumber, "i");
    if (date) query.dateTime = { $gte: new Date(date), $lte: new Date(new Date(date).setHours(23, 59, 59, 999)) };
    if (status) query.status = status;
    if (userEmail) query.email = userEmail;
    if (email) {
      const userFilter = await getUserAndFilterEntries(email);
      query = { ...query, ...userFilter };
    }

    const entries = await Entry.find(query).populate("societyId", "name");
    res.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ message: error.message });
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
        return res.status(400).json({ message: "Invalid status value. Must be 'pending', 'allow', or 'deny'" });
      }
    }

    // Prepare update object
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
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(updatedEntry);
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Entry
router.delete("/:id", async (req, res) => {
  try {
    const deletedEntry = await Entry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Cron Job: Mark entries as expired (runs daily at midnight)
cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  await Entry.updateMany(
    { expirationDateTime: { $lt: now }, expired: false },
    { expired: true }
  );
  console.log("Expired permissions updated");
});

// Get Expiring Soon Entries
router.get("/expiring-soon", async (req, res) => {
  try {
    const { email } = req.query;
    const now = new Date();
    const upcomingExpiration = new Date();
    upcomingExpiration.setDate(now.getDate() + 3);

    const filter = await getUserAndFilterEntries(email);
    const expiringEntries = await Entry.find({
      ...filter,
      expirationDateTime: { $gte: now, $lte: upcomingExpiration },
      expired: false,
    }).populate("societyId", "name");

    res.json(expiringEntries);
  } catch (error) {
    console.error("Error fetching expiring entries:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require("express");
const Entry = require("../models/Entry");
const Admin = require("../models/Admin");
const SecurityGuard = require("../models/SecurityGuard");
const Society = require("../models/Society");
const router = express.Router();
const cron = require("node-cron");

// Helper: Returns a filter based on the user's role and associated societies
const getUserAndFilterEntries = async (email) => {
  console.log("getUserAndFilterEntries called with email:", email); // Debug log
  if (!email) {
    console.log("No email provided, returning empty filter for superadmin");
    return {};
  }

  // Check Admin collection for superadmin
  const admin = await Admin.findOne({ email });
  if (admin && admin.role === "superadmin") {
    console.log("Superadmin found, returning empty filter");
    return {};
  }

  // Check SecurityGuard collection
  const guard = await SecurityGuard.findOne({ email });
  if (!guard && !admin) {
    console.error("User not found for email:", email);
    throw new Error("User not found");
  }

  if (guard) {
    console.log("Security guard found, returning empty filter to view all entries");
    return {};
  }

  // For non-superadmins, filter by societies they manage
  const societies = await Society.find({ adminEmail: email }).select('_id');
  const societyIds = societies.map(s => s._id);
  console.log("Societies managed by admin:", societyIds);
  return { societyId: { $in: societyIds } };
};

// GET Entry Count
router.get("/count", async (req, res) => {
  try {
    const filter = await getUserAndFilterEntries(req.query.email);
    console.log("Fetching entry count with filter:", filter);
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

    console.log("Creating entry with payload:", req.body); // Debug log

    // Validate required fields
    if (!adminEmail || !societyId || !name || !flatNumber || !visitorType || !status || !dateTime || !description || !additionalDateTime) {
      console.error("Missing required fields:", req.body);
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const validStatuses = ["pending", "allow", "deny", "checked-in", "checked-out"];
    if (!validStatuses.includes(status)) {
      console.error("Invalid status value:", status);
      return res.status(400).json({ message: "Invalid status value. Must be 'pending', 'allow', 'deny', 'checked-in', or 'checked-out'" });
    }

    // Fetch society to get the associated adminEmail
    const society = await Society.findById(societyId);
    if (!society) {
      console.error("Society not found for ID:", societyId);
      return res.status(404).json({ message: "Society not found" });
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
      adminEmail: society.adminEmail,
      email,
    });

    const savedEntry = await newEntry.save();
    console.log("Entry saved successfully:", savedEntry); // Debug log
    res.status(201).json(savedEntry);
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

    console.log("Fetching entries with query:", query); // Debug log
    const entries = await Entry.find(query).populate("societyId", "name");
    console.log("Fetched entries:", entries); // Debug log
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

    console.log("Updating entry with ID:", id, "Payload:", req.body); // Debug log

    // Validate status if provided
    if (status) {
      const validStatuses = ["pending", "allow", "deny", "checked-in", "checked-out"];
      if (!validStatuses.includes(status)) {
        console.error("Invalid status value:", status);
        return res.status(400).json({ message: "Invalid status value. Must be 'pending', 'allow', 'deny', 'checked-in', or 'checked-out'" });
      }
    }

    // Fetch society to get the associated adminEmail
    let updatedAdminEmail = adminEmail;
    if (societyId) {
      const society = await Society.findById(societyId);
      if (!society) {
        console.error("Society not found for ID:", societyId);
        return res.status(404).json({ message: "Society not found" });
      }
      updatedAdminEmail = society.adminEmail;
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
    if (updatedAdminEmail) updateData.adminEmail = updatedAdminEmail;
    if (email) updateData.email = email;

    // Recalculate expirationDateTime
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
      console.error("Entry not found for ID:", id);
      return res.status(404).json({ message: "Entry not found" });
    }

    console.log("Entry updated successfully:", updatedEntry); // Debug log
    res.json(updatedEntry);
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Entry
router.delete("/:id", async (req, res) => {
  try {
    console.log("Deleting entry with ID:", req.params.id); // Debug log
    const deletedEntry = await Entry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      console.error("Entry not found for ID:", req.params.id);
      return res.status(404).json({ message: "Entry not found" });
    }
    console.log("Entry deleted successfully:", deletedEntry); // Debug log
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
    console.log("Fetching expiring entries with filter:", filter); // Debug log
    const expiringEntries = await Entry.find({
      ...filter,
      expirationDateTime: { $gte: now, $lte: upcomingExpiration },
      expired: false,
    }).populate("societyId", "name");

    console.log("Expiring entries:", expiringEntries); // Debug log
    res.json(expiringEntries);
  } catch (error) {
    console.error("Error fetching expiring entries:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
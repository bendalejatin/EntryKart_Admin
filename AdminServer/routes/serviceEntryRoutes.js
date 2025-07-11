const express = require("express");
const ServiceEntry = require("../models/ServiceEntry");
const Admin = require("../models/Admin");
const SecurityGuard = require("../models/SecurityGuard");
const router = express.Router();

// Helper: Returns a filter based on the user's role
const getUserAndFilterEntries = async (adminEmail) => {
  if (!adminEmail) {
    return {}; // Allow superadmin to fetch all entries
  }

  // Check Admin collection for superadmin
  const admin = await Admin.findOne({ email: adminEmail });
  if (admin && admin.role === "superadmin") {
    return {}; // Superadmin can view all entries
  }

  // Check SecurityGuard collection
  const guard = await SecurityGuard.findOne({ email: adminEmail });
  if (!guard && !admin) throw new Error("User not found");
  return { adminEmail }; // Guard or non-superadmin can view their own entries
};

// Create Service Entry
router.post("/", async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      societyId,
      photo,
      visitorType,
      description,
      adminEmail,
      status,
    } = req.body;

    // Validate required fields
    if (!adminEmail || !societyId || !name || !phoneNumber || !visitorType) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const validStatuses = ["checked-in", "checked-out", "pending"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Must be 'checked-in', 'checked-out', or 'pending'" });
    }

    const newEntry = new ServiceEntry({
      name,
      phoneNumber,
      societyId,
      photo,
      visitorType,
      description,
      adminEmail,
      status: status || "pending",
      checkInTime: status === "checked-in" ? new Date() : null,
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error creating service entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get All Service Entries
router.get("/", async (req, res) => {
  try {
    const { name, visitorType, status, adminEmail, societyId } = req.query;
    let query = {};

    if (name) query.name = new RegExp(name, "i");
    if (visitorType) query.visitorType = new RegExp(visitorType, "i");
    if (status) query.status = status;
    if (societyId) query.societyId = societyId;
    if (adminEmail) {
      const userFilter = await getUserAndFilterEntries(adminEmail);
      query = { ...query, ...userFilter };
    }

    const entries = await ServiceEntry.find(query).populate("societyId", "name");
    res.json(entries);
  } catch (error) {
    console.error("Error fetching service entries:", error);
    res.status(500).json({ message: error.message || "Failed to fetch service entries" });
  }
});

// Update Service Entry
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ...updateData } = req.body;

    // Validate status if provided
    if (status) {
      const validStatuses = ["checked-in", "checked-out", "pending"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value. Must be 'checked-in', 'checked-out', or 'pending'" });
      }
    }

    const updateFields = { ...updateData };
    if (status === "checked-in") updateFields.checkInTime = new Date();
    if (status === "checked-out") updateFields.checkOutTime = new Date();
    if (status) updateFields.status = status;

    const updatedEntry = await ServiceEntry.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({ message: "Service entry not found" });
    }

    res.json(updatedEntry);
  } catch (error) {
    console.error("Error updating service entry:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Service Entry
router.delete("/:id", async (req, res) => {
  try {
    const deletedEntry = await ServiceEntry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: "Service entry not found" });
    }
    res.json({ message: "Service entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting service entry:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
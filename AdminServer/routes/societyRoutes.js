const express = require("express");
const router = express.Router();
const Society = require("../models/Society");
const Admin = require("../models/Admin");

// (Optional) Helper to filter societies by adminEmail
const getAdminAndFilterSocieties = async (adminEmail) => {
  if (!adminEmail) throw new Error("Admin email is required");
  const admin = await Admin.findOne({ email: adminEmail });
  if (!admin) throw new Error("Admin not found");
  return admin.role === "superadmin" ? {} : { adminEmail };
};

// Create Society
router.post("/", async (req, res) => {
  try {
    const { name, location, totalFlats, adminEmail } = req.body;
    if (!adminEmail)
      return res.status(400).json({ message: "Admin email is required" });
    const flatsArray = Array.from(
      { length: parseInt(totalFlats, 10) },
      (_, i) => `Flat ${i + 1}`
    );
    const society = new Society({
      name,
      location,
      flats: flatsArray,
      adminEmail,
    });
    await society.save();
    res.status(201).json(society);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Societies
router.get("/", async (req, res) => {
  try {
    const filter = await getAdminAndFilterSocieties(req.query.email);
    const societies = await Society.find(filter);
    res.json(societies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Count Societies (for Dashboard)
router.get("/count", async (req, res) => {
  try {
    const filter = await getAdminAndFilterSocieties(req.query.email);
    const count = await Society.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Society – ensure this route works and returns a success message.
router.delete("/:id", async (req, res) => {
  try {
    await Society.findByIdAndDelete(req.params.id);
    res.json({ message: "Society deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

// Update Society
router.put("/:id", async (req, res) => {
  try {
    const { name, location, totalFlats, adminEmail } = req.body;
    const flatsArray = Array.from(
      { length: parseInt(totalFlats, 10) },
      (_, i) => `Flat ${i + 1}`
    );

    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { name, location, flats: flatsArray, adminEmail },
      { new: true, runValidators: true }
    );

    if (!updatedSociety) {
      return res.status(404).json({ message: "Society not found" });
    }

    res.json(updatedSociety);
  } catch (error) {
    z;
    res.status(500).json({ message: error.message });
  }
});

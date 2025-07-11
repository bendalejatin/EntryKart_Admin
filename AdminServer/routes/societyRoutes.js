const express = require("express");
const router = express.Router();
const Society = require("../models/Society");
const Admin = require("../models/Admin");
const SecurityGuard = require("../models/SecurityGuard");

// Helper to filter societies by adminEmail or allow guards to access all
const getAdminAndFilterSocieties = async (email) => {
  if (!email) {
    return {}; // Allow fetching all societies if no email (for guards)
  }
  const admin = await Admin.findOne({ email });
  const guard = await SecurityGuard.findOne({ email });
  
  if (guard) {
    return {}; // Guards can view all societies
  }
  if (!admin) {
    throw new Error("User not found or not authorized");
  }
  return admin.role === "superadmin" ? {} : { adminEmail: email };
};

// Create Society
router.post("/", async (req, res) => {
  try {
    const { name, location, societyType, blocks, flatsPerFloor, floorsPerBlock, totalHouses, adminEmail } = req.body;
    console.log("Create society request body:", req.body); // Debug log

    // Validate inputs
    if (!adminEmail || !name || !location || !societyType) {
      return res.status(400).json({ message: "Name, location, society type, and admin email are required" });
    }

    // Validate adminEmail
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      return res.status(400).json({ message: "Admin email does not exist" });
    }

    let flatsArray = [];
    if (societyType === "RowHouse") {
      if (!totalHouses) {
        return res.status(400).json({ message: "Total houses is required for RowHouse" });
      }
      flatsArray = Array.from({ length: totalHouses }, (_, i) => `House ${i + 1}`);
    } else if (societyType === "Flat") {
      if (!blocks || !flatsPerFloor || !floorsPerBlock) {
        return res.status(400).json({ message: "Blocks, flats per floor, and floors per block are required for Flat" });
      }
      const blocksArray = typeof blocks === "string" ? blocks.split(",").map(b => b.trim()) : blocks;
      const totalFlatsPerBlock = flatsPerFloor * floorsPerBlock;
      flatsArray = blocksArray.flatMap((block) =>
        Array.from({ length: totalFlatsPerBlock }, (_, i) => {
          const floor = Math.floor(i / flatsPerFloor) + 1;
          const flatNumber = floor * 100 + (i % flatsPerFloor) + 1;
          return `${block}-${flatNumber}`;
        })
      );
    } else {
      return res.status(400).json({ message: "Invalid society type" });
    }

    const society = new Society({
      name,
      location,
      societyType,
      blocks: societyType === "Flat" ? (typeof blocks === "string" ? blocks.split(",").map(b => b.trim()) : blocks) : undefined,
      flatsPerFloor: societyType === "Flat" ? flatsPerFloor : undefined,
      floorsPerBlock: societyType === "Flat" ? floorsPerBlock : undefined,
      totalHouses: societyType === "RowHouse" ? totalHouses : undefined,
      flats: flatsArray,
      adminEmail,
    });

    await society.save();
    console.log("Created society:", society); // Debug log
    res.status(201).json(society);
  } catch (error) {
    console.error("Error creating society:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get Societies
router.get("/", async (req, res) => {
  try {
    const email = req.query.email;
    console.log("Fetching societies for email:", email); // Debug log
    const filter = await getAdminAndFilterSocieties(email);
    console.log("Society filter:", filter); // Debug log
    const societies = await Society.find(filter);
    console.log("Fetched societies:", societies); // Debug log
    res.json(societies);
  } catch (error) {
    console.error("Error fetching societies:", error);
    res.status(500).json({ message: error.message });
  }
});

// Count Societies (for Dashboard)
router.get("/count", async (req, res) => {
  try {
    const email = req.query.email;
    console.log("Counting societies for email:", email); // Debug log
    const filter = await getAdminAndFilterSocieties(email);
    const count = await Society.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    console.error("Error counting societies:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete Society
router.delete("/:id", async (req, res) => {
  try {
    console.log("Deleting society with id:", req.params.id); // Debug log
    const society = await Society.findByIdAndDelete(req.params.id);
    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }
    res.json({ message: "Society deleted successfully" });
  } catch (error) {
    console.error("Error deleting society:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update Society
router.put("/:id", async (req, res) => {
  try {
    const { name, location, societyType, blocks, flatsPerFloor, floorsPerBlock, totalHouses, adminEmail } = req.body;
    console.log("Update society request body:", req.body); // Debug log

    // Validate inputs
    if (!adminEmail || !name || !location || !societyType) {
      return res.status(400).json({ message: "Name, location, society type, and admin email are required" });
    }

    // Validate adminEmail
    const admin = await Admin.findOne({ email: adminEmail });
    if (!admin) {
      return res.status(400).json({ message: "Admin email does not exist" });
    }

    let flatsArray = [];
    if (societyType === "RowHouse") {
      if (!totalHouses) {
        return res.status(400).json({ message: "Total houses is required for RowHouse" });
      }
      flatsArray = Array.from({ length: totalHouses }, (_, i) => `House ${i + 1}`);
    } else if (societyType === "Flat") {
      if (!blocks || !flatsPerFloor || !floorsPerBlock) {
        return res.status(400).json({ message: "Blocks, flats per floor, and floors per block are required for Flat" });
      }
      const blocksArray = typeof blocks === "string" ? blocks.split(",").map(b => b.trim()) : blocks;
      const totalFlatsPerBlock = flatsPerFloor * floorsPerBlock;
      flatsArray = blocksArray.flatMap((block) =>
        Array.from({ length: totalFlatsPerBlock }, (_, i) => {
          const floor = Math.floor(i / flatsPerFloor) + 1;
          const flatNumber = floor * 100 + (i % flatsPerFloor) + 1;
          return `${block}-${flatNumber}`;
        })
      );
    } else {
      return res.status(400).json({ message: "Invalid society type" });
    }

    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      {
        name,
        location,
        societyType,
        blocks: societyType === "Flat" ? (typeof blocks === "string" ? blocks.split(",").map(b => b.trim()) : blocks) : undefined,
        flatsPerFloor: societyType === "Flat" ? flatsPerFloor : undefined,
        floorsPerBlock: societyType === "Flat" ? floorsPerBlock : undefined,
        totalHouses: societyType === "RowHouse" ? totalHouses : undefined,
        flats: flatsArray,
        adminEmail,
      },
      { new: true, runValidators: true }
    );

    if (!updatedSociety) {
      return res.status(404).json({ message: "Society not found" });
    }

    console.log("Updated society:", updatedSociety); // Debug log
    res.json(updatedSociety);
  } catch (error) {
    console.error("Error updating society:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
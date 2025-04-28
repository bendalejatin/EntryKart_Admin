const express = require("express");
const router = express.Router();
const Society = require("../models/Society");
const Admin = require("../models/Admin");

// Helper to filter societies by adminEmail
const getAdminAndFilterSocieties = async (adminEmail) => {
  if (!adminEmail) throw new Error("Admin email is required");
  const admin = await Admin.findOne({ email: adminEmail });
  if (!admin) throw new Error("Admin not found");
  return admin.role === "superadmin" ? {} : { adminEmail };
};

// Create Society
router.post("/", async (req, res) => {
  try {
    const { name, location, societyType, blocks, flatsPerFloor, floorsPerBlock, totalHouses, adminEmail } = req.body;

    // Validate inputs
    if (!adminEmail || !name || !location || !societyType) {
      return res.status(400).json({ message: "Name, location, society type, and admin email are required" });
    }

    let flatsArray = [];
    if (societyType === "RowHouse") {
      // Validate RowHouse inputs
      if (!totalHouses) {
        return res.status(400).json({ message: "Total houses is required for RowHouse" });
      }
      // Row House: House 1, House 2, ...
      flatsArray = Array.from({ length: totalHouses }, (_, i) => `House ${i + 1}`);
    } else if (societyType === "Flat") {
      // Validate Flat inputs
      if (!blocks || !flatsPerFloor || !floorsPerBlock) {
        return res.status(400).json({ message: "Blocks, flats per floor, and floors per block are required for Flat" });
      }
      // Convert blocks string to array if provided as a comma-separated string
      const blocksArray = typeof blocks === "string" ? blocks.split(",").map(b => b.trim()) : blocks;
      // Flat: A-101, A-102, ..., B-301, etc.
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

// Delete Society
router.delete("/:id", async (req, res) => {
  try {
    const society = await Society.findByIdAndDelete(req.params.id);
    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }
    res.json({ message: "Society deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Society
router.put("/:id", async (req, res) => {
  try {
    const { name, location, societyType, blocks, flatsPerFloor, floorsPerBlock, totalHouses, adminEmail } = req.body;

    // Validate inputs
    if (!adminEmail || !name || !location || !societyType) {
      return res.status(400).json({ message: "Name, location, society type, and admin email are required" });
    }

    let flatsArray = [];
    if (societyType === "RowHouse") {
      // Validate RowHouse inputs
      if (!totalHouses) {
        return res.status(400).json({ message: "Total houses is required for RowHouse" });
      }
      // Row House: House 1, House 2, ...
      flatsArray = Array.from({ length: totalHouses }, (_, i) => `House ${i + 1}`);
    } else if (societyType === "Flat") {
      // Validate Flat inputs
      if (!blocks || !flatsPerFloor || !floorsPerBlock) {
        return res.status(400).json({ message: "Blocks, flats per floor, and floors per block are required for Flat" });
      }
      // Convert blocks string to array if provided as a comma-separated string
      const blocksArray = typeof blocks === "string" ? blocks.split(",").map(b => b.trim()) : blocks;
      // Flat: A-101, A-102, ..., B-301, etc.
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

    res.json(updatedSociety);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const FlatOwner = require("../models/FlatOwner");
const Society = require("../models/Society");
const User = require("../models/User");
const Admin = require("../models/Admin");

// GET flat owner count (for dashboard)
router.get("/count", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    let filter = {};
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      if (!admin || admin.role !== "superadmin") {
        filter.adminEmail = adminEmail;
      }
    }
    // Filter flat owners based on existing societies
    let societies;
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      let societyFilter = {};
      if (!admin || admin.role !== "superadmin") {
        societyFilter.adminEmail = adminEmail;
      }
      societies = await Society.find(societyFilter, "name");
    } else {
      societies = await Society.find({}, "name");
    }
    const existingSocietyNames = societies.map((society) =>
      society.name.toLowerCase().trim()
    );
    filter.societyName = { $in: existingSocietyNames };

    const count = await FlatOwner.countDocuments(filter);
    res.json({ count });
  } catch (error) {
    console.error("Error in /count:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET all FlatOwner records (for table display)
router.get("/all", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    let filter = {};
    let existingSocietyNames = [];
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      let societyFilter = {};
      if (!admin || admin.role !== "superadmin") {
        societyFilter.adminEmail = adminEmail;
        filter.adminEmail = adminEmail;
      }
      const societies = await Society.find(societyFilter, "name");
      existingSocietyNames = societies.map((society) =>
        society.name.toLowerCase().trim()
      );
    } else {
      const societies = await Society.find({}, "name");
      existingSocietyNames = societies.map((society) =>
        society.name.toLowerCase().trim()
      );
    }
    filter.societyName = { $in: existingSocietyNames };

    const owners = await FlatOwner.find(filter);
    res.json(owners);
  } catch (error) {
    console.error("Error in /all:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET societies for dropdown
router.get("/societies", async (req, res) => {
  try {
    const adminEmail = req.query.email;
    let filter = {};
    if (adminEmail) {
      const admin = await Admin.findOne({ email: adminEmail });
      if (!admin || admin.role !== "superadmin") {
        filter.adminEmail = adminEmail;
      }
    }
    const societies = await Society.find(filter, "name _id");
    res.json(societies);
  } catch (error) {
    console.error("Error in /societies:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET flat numbers for a given society
router.get("/flats/:societyName", async (req, res) => {
  try {
    const society = await Society.findOne({
      name: { $regex: `^${req.params.societyName}$`, $options: "i" },
    });
    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }
    res.json(society.flats);
  } catch (error) {
    console.error("Error in /flats/:societyName:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET owner details by societyName and flatNumber
router.get("/owner/:societyName/:flatNumber", async (req, res) => {
  try {
    const society = await Society.findOne({
      name: { $regex: `^${req.params.societyName}$`, $options: "i" },
    });
    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }
    let owner = await FlatOwner.findOne({
      societyName: { $regex: `^${req.params.societyName}$`, $options: "i" },
      flatNumber: req.params.flatNumber,
    });
    if (!owner) {
      const user = await User.findOne({
        society: society._id,
        flatNumber: req.params.flatNumber,
      });
      if (user) {
        owner = {
          ownerName: user.name,
          profession: user.profession || "",
          contact: user.phone,
          email: user.email,
          adminEmail: user.adminEmail,
          image: "https://via.placeholder.com/300",
          familyMembers: [],
          _id: null,
          societyId: user.society || null, // Include societyId
        };
        return res.json(owner);
      }
      return res.status(404).json({ message: "Owner not found" });
    }
    res.json({
      ...owner.toObject(),
      societyId: society._id, // Include societyId
    });
  } catch (error) {
    console.error("Error in /owner/:societyName/:flatNumber:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET owner details by email (existing)
router.get("/owner-by-email/:email", async (req, res) => {
  try {
    const owner = await FlatOwner.findOne({ email: req.params.email });
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    const society = await Society.findOne({
      name: { $regex: `^${owner.societyName}$`, $options: "i" },
    });
    res.json({
      _id: owner._id,
      societyName: owner.societyName,
      flatNumber: owner.flatNumber,
      ownerName: owner.ownerName,
      profession: owner.profession,
      contact: owner.contact,
      email: owner.email,
      gender: owner.gender,
      adminEmail: owner.adminEmail,
      image: owner.image,
      familyMembers: owner.familyMembers,
      societyId: society ? society._id : null, // Include societyId
    });
  } catch (error) {
    console.error("Error in /owner-by-email/:email:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET owner details by email with User fallback
router.get("/owner-by-email-fallback/:email", async (req, res) => {
  try {
    let owner = await FlatOwner.findOne({ email: req.params.email });
    if (owner) {
      const society = await Society.findOne({
        name: { $regex: `^${owner.societyName}$`, $options: "i" },
      });
      return res.json({
        _id: owner._id,
        societyName: owner.societyName,
        flatNumber: owner.flatNumber,
        ownerName: owner.ownerName,
        profession: owner.profession,
        contact: owner.contact,
        email: owner.email,
        gender: owner.gender,
        adminEmail: owner.adminEmail,
        image: owner.image,
        familyMembers: owner.familyMembers,
        societyId: society ? society._id : null, // Include societyId
      });
    }

    const user = await User.findOne({ email: req.params.email }).populate(
      "society",
      "name"
    );
    if (user) {
      if (!user.society) {
        return res.status(404).json({
          message: "User is not associated with any society. Please contact your society admin to update your profile.",
        });
      }
      return res.json({
        _id: null,
        societyName: user.society ? user.society.name.toLowerCase().trim() : "",
        flatNumber: user.flatNumber || "",
        ownerName: user.name || "",
        profession: user.profession || "",
        contact: user.phone || "",
        email: user.email,
        gender: "",
        adminEmail: user.adminEmail || "",
        image: "https://via.placeholder.com/300",
        familyMembers: [],
        societyId: user.society ? user.society._id : null, // Include societyId
      });
    }

    return res.status(404).json({ message: "Owner not found" });
  } catch (error) {
    console.error("Error in /owner-by-email-fallback:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST owner – Create or update a FlatOwner record and sync with User
router.post("/owner", async (req, res) => {
  try {
    const {
      societyName,
      flatNumber,
      ownerName,
      profession,
      contact,
      email,
      gender,
      adminEmail,
      image,
    } = req.body;
    const normalizedSocietyName = societyName.toLowerCase().trim();
    let owner = await FlatOwner.findOne({
      societyName: normalizedSocietyName,
      flatNumber,
    });
    const society = await Society.findOne({
      name: { $regex: `^${normalizedSocietyName}$`, $options: "i" },
    });
    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }
    if (!owner) {
      owner = new FlatOwner({
        societyName: normalizedSocietyName,
        flatNumber,
        ownerName,
        profession,
        contact,
        email,
        gender,
        adminEmail,
        image: image || "https://via.placeholder.com/300",
        familyMembers: [],
      });
      await owner.save();

      let user = await User.findOne({ society: society._id, flatNumber });
      if (user) {
        user.name = ownerName;
        user.email = email;
        user.phone = contact;
        user.profession = profession;
        user.society = society._id; // Ensure societyId is set
        await user.save();
      } else {
        user = new User({
          name: ownerName,
          flatNumber,
          society: society._id,
          email,
          phone: contact,
          adminEmail,
          profession,
        });
        await user.save();
      }
      return res.status(201).json({ ...owner.toObject(), societyId: society._id });
    } else {
      owner.ownerName = ownerName;
      owner.profession = profession;
      owner.contact = contact;
      owner.email = email;
      owner.gender = gender;
      owner.image = image || owner.image;
      await owner.save();

      let user = await User.findOne({ society: society._id, flatNumber });
      if (user) {
        user.name = ownerName;
        user.email = email;
        user.phone = contact;
        user.profession = profession;
        user.society = society._id; // Ensure societyId is set
        await user.save();
      }
      return res.json({ ...owner.toObject(), societyId: society._id });
    }
  } catch (error) {
    console.error("Error in /owner POST:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// PUT update owner details (without familyMembers) and sync with User model
router.put("/owner/:id/update", async (req, res) => {
  try {
    const {
      ownerName,
      profession,
      contact,
      email,
      societyName,
      flatNumber,
      gender,
      image,
    } = req.body;
    const normalizedSocietyName = societyName.toLowerCase().trim();
    const society = await Society.findOne({
      name: { $regex: `^${normalizedSocietyName}$`, $options: "i" },
    });
    if (!society) {
      return res.status(404).json({ message: "Society not found" });
    }
    const updatedOwner = await FlatOwner.findByIdAndUpdate(
      req.params.id,
      {
        ownerName,
        profession,
        contact,
        email,
        gender,
        societyName: normalizedSocietyName,
        flatNumber,
        image: image || "https://via.placeholder.com/300",
      },
      { new: true }
    );
    if (!updatedOwner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    let user = await User.findOne({ society: society._id, flatNumber });
    if (user) {
      user.name = ownerName;
      user.email = email;
      user.phone = contact;
      user.profession = profession;
      user.society = society._id; // Ensure societyId is set
      await user.save();
    }
    res.json({ ...updatedOwner.toObject(), societyId: society._id });
  } catch (error) {
    console.error("Error in /owner/:id/update:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// DELETE FlatOwner and corresponding User record
router.delete("/owner/:id", async (req, res) => {
  try {
    const owner = await FlatOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    await FlatOwner.findByIdAndDelete(req.params.id);
    const society = await Society.findOne({
      name: { $regex: `^${owner.societyName}$`, $options: "i" },
    });
    if (society) {
      await User.findOneAndDelete({
        society: society._id,
        flatNumber: owner.flatNumber,
      });
    }
    res.json({ message: "Owner and corresponding user deleted" });
  } catch (error) {
    console.error("Error in /owner/:id DELETE:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// PUT add a family member
router.put("/owner/:id/add-family", async (req, res) => {
  try {
    const { name, relation, age, profession, contact } = req.body;
    const owner = await FlatOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    owner.familyMembers.push({ name, relation, age, profession, contact });
    await owner.save();
    res.json(owner);
  } catch (error) {
    console.error("Error in /owner/:id/add-family:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// PUT edit a family member at the specified index
router.put("/owner/:id/edit-family/:index", async (req, res) => {
  try {
    const { name, relation, age, profession, contact } = req.body;
    const owner = await FlatOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    const index = parseInt(req.params.index);
    if (index < 0 || index >= owner.familyMembers.length) {
      return res.status(400).json({ message: "Invalid family member index" });
    }
    owner.familyMembers[index] = { name, relation, age, profession, contact };
    await owner.save();
    res.json(owner);
  } catch (error) {
    console.error("Error in /owner/:id/edit-family/:index:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// DELETE a family member at the specified index
router.delete("/owner/:id/delete-family/:index", async (req, res) => {
  try {
    const owner = await FlatOwner.findById(req.params.id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    const index = parseInt(req.params.index);
    if (index < 0 || index >= owner.familyMembers.length) {
      return res.status(400).json({ message: "Invalid family member index" });
    }
    owner.familyMembers.splice(index, 1);
    await owner.save();
    res.json(owner);
  } catch (error) {
    console.error("Error in /owner/:id/delete-family/:index:", error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
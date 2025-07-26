const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");

// Add multiple vehicles
router.post("/", async (req, res) => {
  try {
    const vehiclesData = Array.isArray(req.body) ? req.body : [req.body];
    const vehicles = vehiclesData.map(data => {
      const { flatNumber, societyName, ownerName, ownerEmail, vehicleType, vehicleName, numberPlate } = data;
      return {
        flatNumber,
        societyName,
        ownerName,
        ownerEmail,
        vehicleType,
        vehicleName,
        numberPlate,
      };
    });
    const savedVehicles = await Vehicle.insertMany(vehicles);
    res.status(201).json(savedVehicles);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get vehicles by flat number
router.get("/flat/:flatNumber", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ flatNumber: req.params.flatNumber });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search vehicles by flat number, owner name, or vehicle name
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      const vehicles = await Vehicle.find();
      return res.json(vehicles);
    }
    const vehicles = await Vehicle.find({
      $or: [
        { flatNumber: { $regex: query, $options: "i" } },
        { ownerName: { $regex: query, $options: "i" } },
        { vehicleName: { $regex: query, $options: "i" } },
      ],
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a vehicle
router.put("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a vehicle
router.delete("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
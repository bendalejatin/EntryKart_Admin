const mongoose = require("mongoose");

const societySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  societyType: { type: String, enum: ["RowHouse", "Flat"], required: true }, // New field
  blocks: { type: [String], required: false }, // Optional for RowHouse
  flatsPerFloor: { type: Number, required: false }, // Optional for RowHouse
  floorsPerBlock: { type: Number, required: false }, // Optional for RowHouse
  totalHouses: { type: Number, required: false }, // Optional for Flat
  flats: { type: [String], default: [] }, // Generated flats (e.g., ["House 1", "House 2"] or ["A-101", "D-201"])
  adminEmail: { type: String, required: true } // Record owner
});

module.exports = mongoose.model("Society", societySchema);
// models/Vehicle.js
const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  flatNumber: {
    type: String,
    required: true,
  },
  societyName: {
    type: String,
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  ownerEmail: {
    type: String,
    required: true,
  },
  vehicleType: {
    type: String,
    enum: ["bike", "car"],
    required: true,
  },
  vehicleName: {
    type: String,
    required: true,
  },
  numberPlate: {
    type: String,
    required: true,
    unique: true,
    match: /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/, // e.g., MH12AB1234
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
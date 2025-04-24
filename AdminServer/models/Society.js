const mongoose = require("mongoose");

const societySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  flats: { type: [String], default: [] },
  adminEmail: { type: String, required: true }  
});

module.exports = mongoose.model("Society", societySchema);

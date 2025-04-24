const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String, default: "https://via.placeholder.com/300" },
  adminEmail: { type: String, required: true },
  societyName: { type: String, required: true },
});

module.exports = mongoose.model("Event", eventSchema);
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ["admin", "superadmin"], default: "admin" },
  image: { type: String, default: "https://via.placeholder.com/300" },
});

module.exports = mongoose.model("Admin", adminSchema);

const mongoose = require("mongoose");

const serviceEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Society",
    required: true,
  },
  photo: { type: String }, // Base64 string or URL for the photo
  visitorType: { type: String, required: true }, // e.g., Newspaper Boy, Postman
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  status: {
    type: String,
    enum: ["checked-in", "checked-out", "pending"],
    default: "pending",
  },
  description: { type: String },
  adminEmail: { type: String, required: true }, // Renamed from guardEmail
}, {
  timestamps: true,
});

module.exports = mongoose.model("ServiceEntry", serviceEntrySchema);
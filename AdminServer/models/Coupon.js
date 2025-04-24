const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema({
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  flatNo: { type: String, required: true },
  userName: { type: String, required: true },
  code: { type: String, unique: true, required: true },
  expiryDate: { 
    type: String, // stored as YYYY-MM-DD
    required: true
  },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  adminEmail: { type: String, required: true },
  qrCode: { type: String }, // Will store the QR code as a Data URL
  status: { type: String, default: "active" }, // "active", "used", "expired"
  used: { type: Boolean, default: false }
});

CouponSchema.pre("save", function(next) {
  if (this.expiryDate) {
    this.expiryDate = new Date(this.expiryDate).toISOString().split("T")[0];
  }
  next();
});

module.exports = mongoose.model("Coupon", CouponSchema);


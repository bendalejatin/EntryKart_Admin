const mongoose = require("mongoose");

const broadcastMessageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  broadcastType: { type: String, enum: ["specific", "society", "all"], required: true },
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
  flatNo: { type: String, default: null },
  adminEmail: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BroadcastMessage", broadcastMessageSchema);

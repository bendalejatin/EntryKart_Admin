const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "FlatOwner", required: true },
  societyName: { type: String, required: true },
  flatNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paymentDate: { type: Date },
  status: { type: String, enum: ["Pending", "Paid", "Overdue"], default: "Pending" },
  penalty: { type: Number, default: 0 },
  adminEmail: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Maintenance", MaintenanceSchema);
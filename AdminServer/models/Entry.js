const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  societyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Society', 
    required: true 
  }, 
  flatNumber: { type: String, required: true },
  email: { type: String, required: true }, 
  dateTime: { type: Date, required: true },
  description: { type: String, required: true },
  additionalDateTime: { type: Date, required: true },
  visitorType: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'allow', 'deny'], // Enforce valid status values
    default: 'pending', // Default to 'pending'
  },
  expirationDateTime: { type: Date, required: true },
  expired: { type: Boolean, default: false },
  adminEmail: { type: String, required: true } 
}, {
  timestamps: true,
});

module.exports = mongoose.model('Entry', entrySchema);
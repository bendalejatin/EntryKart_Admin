const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const securityGuardSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    default: 'security',
    enum: ['security'],
    required: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: [true, 'Society is required'] // Making it required since guard must be associated with a society
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
});

// Hash password before saving
securityGuardSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.updatedAt = Date.now();
  next();
});

// Update updatedAt on any document update
securityGuardSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Method to compare passwords
securityGuardSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const SecurityGuard = mongoose.model('SecurityGuard', securityGuardSchema);

module.exports = SecurityGuard;
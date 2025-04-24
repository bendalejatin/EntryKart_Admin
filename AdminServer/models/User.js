const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  flatNumber: { type: String, required: true },
  society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  adminEmail: { type: String, required: true },
  profession: { type: String }, 
  password: { type: String }, 
});

module.exports = mongoose.model("User", userSchema);

const bcrypt = require('bcryptjs');

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};


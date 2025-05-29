const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  number: { type: String, required: true },
  name: { type: String },
  photo: { type: String },
  otp: String,
  otpExpires: Date,
   isAdmin: { type: Boolean, default: false } // ✅ Add this
});

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  otp: String,
  otpExpires: Date,
});

module.exports = mongoose.model('User', userSchema);

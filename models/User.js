const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  number: { type: String, required: true },
  name: { type: String },
  photo: { type: String },
  otp: String,
  otpExpires: Date
});

module.exports = mongoose.model('User', userSchema);

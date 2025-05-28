const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venue: { type: String },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  esewaRefId: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);

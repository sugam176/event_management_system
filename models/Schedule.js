// models/Schedule.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  venue: { type: String },
  pricing: { type: String },
  type: { type: String, required: true },
  date: { type: Date, required: true },
 time: { type: String, required: true },

  image: { type: String }, // store filename or URL
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);

// routes/admin.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Schedule = require('../models/Schedule');
const fs = require('fs');
require('dotenv').config();
const User = require('../models/User');
const sendEmail = require('../middleware/sendEmail');

const isAdmin = require('../middleware/isAdmin');




// Multer config for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// GET form (optional for direct access)
router.get('/createEvent',isAdmin, (req, res) => {
  res.render('createEvent');
});

router.post('/createEvent', upload.single('image'), async (req, res) => {
  try {
    const { title, description, type, date, venue, pricing, time } = req.body;
    const image = req.file ? req.file.filename : null;

    // Save the event
    const newSchedule = new Schedule({ title, description, type, date, venue, pricing, time, image });
    await newSchedule.save();

    // Get all user emails
    const users = await User.find({}, 'email');
    const emailList = users.map(user => user.email);

    // Prepare email content
    const subject = `New Event: ${title}`;
    const message = `Hello!\n\nA new ${type} event titled "${title}" has been scheduled.\n\n📍 Venue: ${venue}\n📅 Date: ${new Date(date).toDateString()}\n⏰ Time: ${time}\n💰 Price: ${pricing || 'Free'}\n\nSee you there!\n\n- Event Team`;

    // Send email to each user
    await Promise.all(emailList.map(email => sendEmail(email, subject, message)));

    res.redirect('/');
  } catch (err) {
    console.error("Event creation or email sending error:", err);
    res.status(500).send("Something went wrong");
  }
});


router.get('/dashboard',isAdmin, async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ date: -1 });



    res.render('admin', { schedules });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch events.');
  }
});





// Delete event
router.post('/deleteEvent/:id', async (req, res) => {
  try {
    const event = await Schedule.findByIdAndDelete(req.params.id);
    if (event.image) {
      const imagePath = path.join(__dirname, '..', 'public', 'uploads', event.image);
      fs.unlink(imagePath, err => {
        if (err) console.error('Image delete error:', err);
      });
    }
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting event.");
  }
});
















module.exports = router;

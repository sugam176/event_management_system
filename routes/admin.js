// routes/admin.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Schedule = require('../models/Schedule');

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
router.get('/createEvent', (req, res) => {
  res.render('createEvent');
});

// POST form
router.post('/createEvent', upload.single('image'), async (req, res) => {
  try {
    const { title, description, type, date, venue, pricing, time } = req.body;
    console.log(req.body)
    const image = req.file ? req.file.filename : null;

    const newSchedule = new Schedule({ title, description, type, date, venue, pricing, time, image });
    await newSchedule.save();

    res.redirect('/'); // redirect after save
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;

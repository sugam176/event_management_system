const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const ensureAuthenticated = require('../middleware/ensureLogin');
const path = require('path');

// File upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// GET settings page
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findById(userId);
    res.render('settings', { user });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load settings.');
    res.redirect('/');
  }
});

// POST update profile
router.post('/', ensureAuthenticated, upload.single('photo'), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { name, number } = req.body;

    const updateData = { name, number };

    if (req.file) {
      updateData.photo = '/' + req.file.filename;
    }

    await User.findByIdAndUpdate(userId, updateData);

    // Update session
    const updatedUser = await User.findById(userId);
    req.session.user = {
      id: updatedUser._id,
      email: updatedUser.email,
      name: updatedUser.name,
      number: updatedUser.number,
      photo: updatedUser.photo
    };

    req.flash('success_msg', 'Profile updated successfully.');
    res.redirect('/settings');

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to update profile.');
    res.redirect('/settings');
  }
});

module.exports = router;

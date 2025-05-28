const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const multer = require('multer');

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
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

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sugamra2001@gmail.com',
    pass: 'mjjrsbkfgztvshbg',
  },
});

// GET signup
router.get('/signup', (req, res) => {
  res.render('signup');
});

// GET login
router.get('/login', (req, res) => {
  res.render('login');
});

// POST signup
router.post('/signup', upload.single('photo'), async (req, res) => {
  try {
    const { name, email, password, number } = req.body;

    if (!name || !email || !password || !number) {
      req.flash('error_msg', 'All fields are required.');
      return res.redirect('/signup');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error_msg', 'Email is already registered.');
      return res.redirect('/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    let photoPath = '';
    if (req.file) {
      photoPath = '/' + req.file.filename;
    }

    req.session.tempUser = {
      name,
      email,
      password: hashedPassword,
      number,
      photo: photoPath,
      otp,
      otpExpires
    };

    await transporter.sendMail({
      from: 'sugamra2001@gmail.com',
      to: email,
      subject: 'OTP Verification',
      html: `<p>Your OTP is <b>${otp}</b>. It will expire in 5 minutes.</p>`,
    });

    req.flash('success_msg', 'OTP sent to your email!');
    res.render('verify-otp', { email });

  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to send OTP.');
    res.redirect('/signup');
  }
});

// POST verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const tempUser = req.session.tempUser;

  if (!tempUser || tempUser.email !== email) {
    req.flash('error_msg', 'Session expired or email mismatch.');
    return res.redirect('/signup');
  }

  if (otp !== tempUser.otp || Date.now() > tempUser.otpExpires) {
    req.flash('error_msg', 'Invalid or expired OTP.');
    return res.render('verify-otp', { email });
  }

  const newUser = new User({
    email: tempUser.email,
    password: tempUser.password,
    number: tempUser.number,
    name: tempUser.name,
    photo: tempUser.photo || ''
  });

  await newUser.save();
  req.session.user = { id: newUser._id, email: newUser.email };
  req.session.tempUser = null;

  req.flash('success_msg', 'Signup successful! You are now logged in.');
  res.redirect('/');
});

// POST login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error_msg', 'Email and password are required.');
    return res.redirect('/login');
  }

  const user = await User.findOne({ email });
  if (!user) {
    req.flash('error_msg', 'User not found. Please signup first.');
    return res.redirect('/signup');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash('error_msg', 'Incorrect password.');
    return res.redirect('/login');
  }

  req.session.user = {
    id: user._id,
    email: user.email,
    number: user.number,
    photo: user.photo,
    name: user.name
  };

  req.flash('success_msg', 'Logged in successfully!');
  res.redirect('/');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    req.flash('success_msg', 'You have logged out.');
    res.redirect('/login');
  });
});

module.exports = router;

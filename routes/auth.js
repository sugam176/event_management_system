const express = require('express');
const router = express.Router();
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Gmail transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sugamra2001@gmail.com',
    pass: 'mjjrsbkfgztvshbg', // Gmail App Password (not real one!)
  },
});

// GET: Signup page
router.get('/signup', (req, res) => {
  res.render('signup');
});

// POST: Signup - send OTP (but don't save user yet)
router.post('/signup', async (req, res) => {
  const { name, email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 5 * 60 * 1000;

  // Temporarily store OTP in session
  req.session.tempUser = { name, email, otp, otpExpires };

  await transporter.sendMail({
    from: 'sugamra2001@gmail.com',
    to: email,
    subject: 'Your OTP Code for Signup',
    html: `<p>Hi ${name}, your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  });

  res.render('verify-otp', { email });
});

// GET: Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// POST: Login - send OTP (existing users only)
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send('User not found!');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 5 * 60 * 1000;

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  await transporter.sendMail({
    from: 'sugamra2001@gmail.com',
    to: email,
    subject: 'Your OTP Code for Login',
    html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  });

  res.render('verify-otp', { email });
});

// POST: Verify OTP (signup or login)
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  // Check if this is signup (from session)
  if (req.session.tempUser && req.session.tempUser.email === email) {
    const { name, otp: sessionOtp, otpExpires } = req.session.tempUser;

    if (otp !== sessionOtp || Date.now() > otpExpires) {
      return res.send('Invalid or expired OTP');
    }

    // Save user to DB now
    const newUser = new User({ name, email });
    await newUser.save();

    req.session.user = { email, name, id: newUser._id };
    req.session.tempUser = null; // clear temp session
    return res.redirect('/');
  }

  // Otherwise it's login
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || Date.now() > user.otpExpires) {
    return res.send('Invalid or expired OTP');
  }

  // Clear OTP and login
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  req.session.user = {
    email: user.email,
    name: user.name,
    id: user._id
  };

  res.redirect('/');
});

module.exports = router;

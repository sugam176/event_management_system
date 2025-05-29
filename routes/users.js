const express = require('express');
const router = express.Router();
const multer = require('multer');

const User = require('../models/User');
const sendEmail = require('../middleware/sendEmail');
const bcrypt = require('bcrypt');

// Setup multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });



// === GET Signup Page ===
router.get('/signup', (req, res) => {
  res.render('signup');
});

// === POST Signup: Generate OTP, Store Temp User in Session ===
router.post('/signup', upload.single('photo'), async (req, res) => {
  const { name, email, password, number } = req.body;
  const photo = req.file ? req.file.filename : null;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.send('Email already exists.');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store in session until OTP is verified
    req.session.tempUser = { name, email, password: hashedPassword, number, photo };
    req.session.otp = otp;
    req.session.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Send OTP email
    await sendEmail(
      email,
      'Your OTP Code',
      `Hello ${name},\n\nYour OTP is: ${otp}. It expires in 5 minutes.`
    );

    res.render('verifyOtp', { email });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error sending OTP');
  }
});

// === POST Verify OTP ===
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const { tempUser, otp: sessionOtp, otpExpires } = req.session;

    if (!tempUser || tempUser.email !== email) return res.send('No matching user session found.');
    if (Date.now() > otpExpires) return res.send('OTP has expired.');
    if (otp !== sessionOtp) return res.send('Invalid OTP.');

    const newUser = new User(tempUser);
    await newUser.save();

    // Clear session
    req.session.tempUser = null;
    req.session.otp = null;
    req.session.otpExpires = null;

    res.send('Signup successful! You can now log in.');
  } catch (err) {
    console.error(err);
    res.status(500).send('OTP verification failed');
  }
});

// === GET Login Page ===
router.get('/login', (req, res) => {
  res.render('login');
});

// === POST Login ===
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.send('User not found.');

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.send('Invalid password.');

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      isAdmin: user.isAdmin // ✅ Important
    };


    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Login failed.');
  }
});




// === GET Logout ===
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Logout failed.');
    }
    res.clearCookie('connect.sid'); // Optional: clears session cookie
    res.redirect('/users/login'); // Redirect to login or homepage
  });
});

module.exports = router;

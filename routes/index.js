var express = require('express');
var router = express.Router();
const Schedule = require("../models/Schedule");

// Home page (with some events maybe shown)
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find();
    const user = req.session.user || null;
    console.log("User from session:", user);

    res.render('index', {
      schedules,
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch events");
  }
});

// ✅ All Events Page
router.get('/events', async (req, res) => {
  try {
    const schedules = await Schedule.find({});
    const user = req.session.user || null;
    res.render('events', { schedules, user });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// Create Event Page
router.get('/createEvent', function (req, res, next) {
  res.render('createEvent', { title: 'Create Event' });
});

module.exports = router;

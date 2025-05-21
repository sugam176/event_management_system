var express = require('express');
var router = express.Router();
const Schedule=require("../models/Schedule")

/* GET home page. */
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find();
console.log(schedules)
    res.render('index', { schedules });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch events");
  }
});

router.get('/createEvent', function(req, res, next) {
  res.render('createEvent', { title: 'Express' });
});

module.exports = router;

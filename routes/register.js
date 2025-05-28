// routes/admin.js
const express = require('express');
const router = express.Router();
const ensureLoggedIn = require('../middleware/ensureLogin');
const Schedule = require('../models/Schedule');
const EventRegistration = require('../models/event');

const axios = require('axios');
router.post('/esewa/verify', async (req, res) => {
    const { pid, refId, amt } = req.body;

    // Call eSewa verification API
    const url = 'https://esewa.com.np/epay/transrec';
    const params = new URLSearchParams();
    params.append('amt', amt);
    params.append('pid', pid);
    params.append('scd', 'EPAYTEST'); // your merchant code from eSewa dashboard
    params.append('rid', refId);

    try {
        const response = await axios.post(url, params);

        if (response.data.includes('<response_code>Success</response_code>')) {
            // Payment successful, update registration
            await EventRegistration.findByIdAndUpdate(pid, {
                paymentStatus: 'success',
                esewaRefId: refId,
            });

            res.send('Payment successful! Registration confirmed.');
        } else {
            // Payment failed or verification failed
            await EventRegistration.findByIdAndUpdate(pid, {
                paymentStatus: 'failed',
            });
            res.send('Payment verification failed.');
        }
    } catch (error) {
        console.error(error);
        res.send('Error verifying payment.');
    }
});





// Show events by category for registration
router.get('/register', ensureLoggedIn, async (req, res) => {
    const categories = ['Cultural', 'Food', 'Notice', 'Sports', 'Workshop'];
    res.render('register', { categories });
});

// Show events under a category
router.get('/register/:id', ensureLoggedIn, async (req, res) => {
    try {
        const event = await Schedule.findById(req.params.id);
        if (!event) return res.status(404).send('Event not found');
        res.render('register', { event });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// Show form for a single event to register
router.get('/register/:category/:eventId', ensureLoggedIn, async (req, res) => {
    const event = await Schedule.findById(req.params.eventId);
    if (!event) return res.send('Event not found');
    res.render('eventRegistrationForm', { event });
});








// POST registration with amount, redirect to eSewa
router.post('/register/:eventId', ensureLoggedIn, async (req, res) => {
    const { amount } = req.body;
    const eventId = req.params.eventId;
    const userId = req.session.user.id;

    // Create registration with status pending
    const registration = new EventRegistration({
        user: userId,
        event: eventId,
        amount,
        paymentStatus: 'pending',
    });

    await registration.save();

    // Prepare eSewa payment params
    const params = {
        amt: amount,
        psc: 0,
        pdc: 0,
        tAmt: amount,
        pid: registration._id.toString(),
        su: `http://yourdomain.com/esewa/success`, // replace your domain
        fu: `http://yourdomain.com/esewa/failure`,
    };

    // Redirect user to eSewa payment page
    const esewaUrl = `https://esewa.com.np/epay/main?amt=${params.amt}&psc=${params.psc}&pdc=${params.pdc}&tAmt=${params.tAmt}&pid=${params.pid}&su=${encodeURIComponent(params.su)}&fu=${encodeURIComponent(params.fu)}`;
    res.redirect(esewaUrl);
});


module.exports = router;

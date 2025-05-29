// routes/admin.js
const express = require('express');
const router = express.Router();
const ensureLoggedIn = require('../middleware/ensureLogin');
const Schedule = require('../models/Schedule');
const EventRegistration = require('../models/event');




// Show categories (optional)
router.get('/register', ensureLoggedIn, async (req, res) => {
    const categories = ['Cultural', 'Food', 'Notice', 'Sports', 'Workshop'];
    res.render('register', { categories, event: null }); // Pass event: null for safety
});

// Show event registration form
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

// eSewa success redirect
router.post('/success', ensureLoggedIn, async (req, res) => {
    try {
        // You can also verify payment from eSewa API if needed
        const { oid, amt, refId } = req.body;
        const userId = req.user._id; // assuming passport.js or similar

        const existing = await Registration.findOne({ eventId: oid, userId });
        if (!existing) {
            await Registration.create({
                eventId: oid,
                userId,
                paymentRef: refId,
                amount: amt
            });
        }

        res.send("Payment successful and registered!");
    } catch (err) {
        console.error(err);
        res.status(500).send('Error registering payment');
    }
});

router.post('/failure', ensureLoggedIn, (req, res) => {
    res.send("Payment failed. Please try again.");
});



module.exports = router;

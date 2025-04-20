const express = require('express');
const router = express.Router();
const bkashController = require('../controllers/bkashController');

// bKash payment routes
router.post('/token', bkashController.getToken);
router.get('/createpayment', bkashController.createPayment);
router.get('/executepayment', bkashController.executePayment);

module.exports = router;
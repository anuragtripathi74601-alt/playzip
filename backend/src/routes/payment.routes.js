const express = require('express');
const router = express.Router();

// Payment gateway webhooks
router.post('/razorpay/webhook', async (req, res) => {
  try {
    const event = req.body;
    // Verify webhook signature
    // Process payment event
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/phonepe/webhook', async (req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/paytm/webhook', async (req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;

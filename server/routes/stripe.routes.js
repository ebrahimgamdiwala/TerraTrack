import express from 'express';
import { 
  createStripeCheckoutSession, 
  handlePaymentSuccess, 
  getPaymentStatus 
} from '../controllers/stripe.controller.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Create checkout session
router.post('/create-checkout-session', auth, createStripeCheckoutSession);

// Handle payment success
router.post('/payment-success', auth, handlePaymentSuccess);

// Get payment status
router.get('/payment-status/:sessionId', auth, getPaymentStatus);

export default router;
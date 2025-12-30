import express from 'express';
import { 
  createDonation,
  getCampaignDonations,
  getUserDonations,
  getDonationById,
  getDonationReceipt,
  getDonationStats
} from '../controllers/donation.controllers.js';
import auth from '../middlewares/auth.js';
import { admin } from '../middlewares/admin.js';

const router = express.Router();

// Protected routes (authentication required)
router.post('/', auth, createDonation);
router.get('/my-donations', auth, getUserDonations);
router.get('/:id', auth, getDonationById);
router.get('/:id/receipt', auth, getDonationReceipt);

// Public routes for campaign donations (anonymized)
router.get('/campaign/:campaignId', getCampaignDonations);

// Admin only routes
router.get('/stats/overview', auth, admin, getDonationStats);

export default router;
import express from 'express';
import { 
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addCampaignUpdate,
  getCampaignStats
} from '../controllers/campaign.controllers.js';
import auth from '../middlewares/auth.js';
import { admin } from '../middlewares/admin.js';
import upload from '../middlewares/multer.js';

const router = express.Router();

// Public routes
router.get('/', getAllCampaigns);
router.get('/stats', getCampaignStats); // Public stats for frontend display
router.get('/:id', getCampaignById);

// Protected routes (authentication required)
// Admin only routes
router.post('/', auth, admin, upload.single('image'), createCampaign);
router.put('/:id', auth, admin, upload.single('image'), updateCampaign);
router.delete('/:id', auth, admin, deleteCampaign);
router.post('/:id/updates', auth, admin, upload.single('image'), addCampaignUpdate);

export default router;
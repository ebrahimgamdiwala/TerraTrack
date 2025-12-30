import Donation from '../models/donation.model.js';
import Campaign from '../models/campaign.model.js';
import UserModel from '../models/user.model.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Create donation
const createDonation = async (req, res) => {
  try {
    const {
      campaignId,
      amount,
      donorName,
      donorEmail,
      isAnonymous,
      message,
      paymentMethod,
      paymentProcessor = 'stripe'
    } = req.body;

    // Validate required fields
    if (!campaignId || !amount || !donorName || !donorEmail || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate campaign exists and is active
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not active for donations'
      });
    }

    // Check if campaign has ended
    if (new Date() > campaign.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Campaign has ended'
      });
    }

    // Generate unique transaction ID
    const transactionId = `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const processorTransactionId = `${paymentProcessor}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    const donationData = {
      campaignId,
      userId: req.userId,
      amount: parseFloat(amount),
      donorName,
      donorEmail,
      isAnonymous: isAnonymous || false,
      message,
      paymentMethod,
      paymentProcessor,
      transactionId,
      processorTransactionId,
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        referralSource: req.get('Referer')
      }
    };

    const donation = new Donation(donationData);
    await donation.save();

    // Simulate payment processing (in real app, integrate with Stripe/PayPal)
    // For demo purposes, we'll mark it as completed immediately
    donation.paymentStatus = 'completed';
    donation.processedAt = Date.now();
    donation.receiptUrl = `${req.protocol}://${req.get('host')}/api/donations/${donation._id}/receipt`;
    await donation.save();

    const populatedDonation = await Donation.findById(donation._id)
      .populate('campaignId', 'title shortDescription')
      .populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: populatedDonation
    });

  } catch (error) {
    console.error('Error creating donation:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating donation',
      error: error.message
    });
  }
};

// Get donations for a campaign
const getCampaignDonations = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { page = 1, limit = 20, status = 'completed' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID format'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const donations = await Donation.find({
      campaignId,
      paymentStatus: status
    })
      .populate('userId', 'name email')
      .sort({ donationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-metadata -processorTransactionId')
      .lean();

    const total = await Donation.countDocuments({
      campaignId,
      paymentStatus: status
    });

    // Anonymize donations as needed
    const anonymizedDonations = donations.map(donation => ({
      ...donation,
      donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
      donorEmail: donation.isAnonymous ? 'hidden' : donation.donorEmail,
      userId: donation.isAnonymous ? null : donation.userId
    }));

    res.status(200).json({
      success: true,
      data: anonymizedDonations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDonations: total
      }
    });

  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donations',
      error: error.message
    });
  }
};

// Get user's donations
const getUserDonations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('🔍 Fetching donations for user:', req.userId);
    
    // First check if any donations exist for this user
    const allUserDonations = await Donation.find({ userId: req.userId });
    console.log('📊 Total donations found for user (all statuses):', allUserDonations.length);
    
    const donations = await Donation.find({ userId: req.userId })
      .populate('campaignId', 'title shortDescription imageUrl status category')
      .sort({ donationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-metadata -processorTransactionId');

    console.log('📊 Found donations count after filtering:', donations.length);
    console.log('💰 Donations data:', JSON.stringify(donations, null, 2));

    const total = await Donation.countDocuments({ userId: req.userId });
    console.log('📊 Total donations in DB for user:', total);

    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDonations: total
      }
    });

  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user donations',
      error: error.message
    });
  }
};

// Get donation by ID
const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation ID format'
      });
    }

    const donation = await Donation.findById(id)
      .populate('campaignId', 'title shortDescription')
      .populate('userId', 'name email');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check if user can access this donation
    const currentUser = await UserModel.findById(req.userId);
    if (donation.userId._id.toString() !== req.userId.toString() && currentUser?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: donation
    });

  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation',
      error: error.message
    });
  }
};

// Get donation receipt
const getDonationReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donation ID format'
      });
    }

    const donation = await Donation.findById(id)
      .populate('campaignId', 'title organizer organizerContact')
      .populate('userId', 'name email');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check if user can access this receipt
    const currentUser = await UserModel.findById(req.userId);
    if (donation.userId._id.toString() !== req.userId.toString() && currentUser?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (donation.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Receipt not available for incomplete donations'
      });
    }

    const receipt = {
      receiptId: donation.transactionId,
      donationId: donation._id,
      campaignTitle: donation.campaignId.title,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      amount: donation.amount,
      currency: donation.currency,
      donationDate: donation.donationDate,
      paymentMethod: donation.paymentMethod,
      transactionId: donation.transactionId,
      organizer: donation.campaignId.organizer,
      organizerEmail: donation.campaignId.organizerContact.email,
      message: donation.message
    };

    res.status(200).json({
      success: true,
      data: receipt
    });

  } catch (error) {
    console.error('Error fetching donation receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation receipt',
      error: error.message
    });
  }
};

// Get donation statistics (Admin only)
const getDonationStats = async (req, res) => {
  try {
    const { campaignId, timeframe = '30d' } = req.query;

    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case '7d':
        dateFilter = { donationDate: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        dateFilter = { donationDate: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case '90d':
        dateFilter = { donationDate: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
      case '1y':
        dateFilter = { donationDate: { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) } };
        break;
    }

    const matchFilter = {
      paymentStatus: 'completed',
      ...dateFilter
    };

    if (campaignId) {
      matchFilter.campaignId = mongoose.Types.ObjectId(campaignId);
    }

    const stats = await Donation.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalDonations: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageDonation: { $avg: '$amount' },
                uniqueDonors: { $addToSet: '$userId' }
              }
            },
            {
              $project: {
                totalDonations: 1,
                totalAmount: 1,
                averageDonation: 1,
                uniqueDonors: { $size: '$uniqueDonors' }
              }
            }
          ],
          paymentMethodStats: [
            {
              $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            }
          ],
          dailyStats: [
            {
              $group: {
                _id: {
                  date: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$donationDate'
                    }
                  }
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              }
            },
            { $sort: { '_id.date': 1 } }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donation statistics',
      error: error.message
    });
  }
};

export {
  createDonation,
  getCampaignDonations,
  getUserDonations,
  getDonationById,
  getDonationReceipt,
  getDonationStats
};
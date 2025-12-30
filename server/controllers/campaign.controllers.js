import Campaign from '../models/campaign.model.js';
import Donation from '../models/donation.model.js';
import uploadImageCloudinary from '../utils/uploadImageCloudinary.js';
import mongoose from 'mongoose';

// Get all campaigns with filtering and pagination
const getAllCampaigns = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      status,
      featured,
      urgent,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (urgent !== undefined) filter.urgent = urgent === 'true';
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Campaign.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCampaigns: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message
    });
  }
};

// Get campaign by ID
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID format'
      });
    }

    const campaign = await Campaign.findById(id)
      .populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Get recent donations for this campaign (anonymized)
    const recentDonations = await Donation.find({
      campaignId: id,
      paymentStatus: 'completed'
    })
      .sort({ donationDate: -1 })
      .limit(10)
      .select('amount donorName isAnonymous message donationDate')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...campaign.toObject(),
        recentDonations: recentDonations.map(donation => ({
          amount: donation.amount,
          donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
          message: donation.message,
          donationDate: donation.donationDate
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign',
      error: error.message
    });
  }
};

// Create new campaign (Admin only)
const createCampaign = async (req, res) => {
  try {
    console.log('Received form data:', req.body);
    
    // Transform form data to match schema
    const {
      title,
      description,
      shortDescription,
      category,
      goalAmount,
      startDate,
      endDate,
      location,
      organizer,
      organizerEmail,
      expectedImpact,
      targetMetrics: targetMetricsRaw = '[]'
    } = req.body;

    // Parse targetMetrics if it's a JSON string
    let targetMetrics;
    try {
      targetMetrics = typeof targetMetricsRaw === 'string' ? JSON.parse(targetMetricsRaw) : targetMetricsRaw;
      if (!Array.isArray(targetMetrics)) {
        targetMetrics = [];
      }
    } catch (error) {
      console.log('Error parsing targetMetrics:', error);
      targetMetrics = [];
    }

    const campaignData = {
      title,
      description,
      shortDescription,
      category,
      goalAmount: parseFloat(goalAmount),
      startDate: startDate || new Date(),
      endDate: new Date(endDate),
      location,
      organizer,
      organizerContact: {
        email: organizerEmail
      },
      impactMetrics: {
        expectedImpact,
        measurableGoals: targetMetrics.filter(metric => metric.name && metric.target && metric.unit).map(metric => ({
          metric: metric.name,
          target: `${metric.target} ${metric.unit}`,
          achieved: 'In Progress'
        }))
      },
      createdBy: req.user._id
    };

    // Handle image upload if provided
    if (req.file) {
      try {
        const uploadResult = await uploadImageCloudinary(req.file.buffer);
        campaignData.imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }

    const campaign = new Campaign(campaignData);
    await campaign.save();

    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: populatedCampaign
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    
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
      message: 'Error creating campaign',
      error: error.message
    });
  }
};

// Update campaign (Admin only)
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID format'
      });
    }

    const updateData = { ...req.body, updatedAt: Date.now() };

    // Handle image upload if provided
    if (req.file) {
      try {
        const uploadResult = await uploadImageCloudinary(req.file.buffer);
        updateData.imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    
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
      message: 'Error updating campaign',
      error: error.message
    });
  }
};

// Delete campaign (Admin only)
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID format'
      });
    }

    // Check if campaign has any donations before deleting
    const donationsCount = await Donation.countDocuments({
      campaignId: id,
      paymentStatus: 'completed'
    });

    if (donationsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete campaign with existing donations. Consider marking it as cancelled instead.'
      });
    }

    const campaign = await Campaign.findByIdAndDelete(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Clean up any pending donations for this campaign
    await Donation.deleteMany({
      campaignId: id,
      paymentStatus: { $in: ['pending', 'failed'] }
    });

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting campaign',
      error: error.message
    });
  }
};

// Add campaign update (Admin only)
const addCampaignUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign ID format'
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Update title and content are required'
      });
    }

    const updateData = { title, content, date: Date.now() };

    // Handle image upload if provided
    if (req.file) {
      try {
        const uploadResult = await uploadImageCloudinary(req.file.buffer);
        updateData.imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Error uploading image',
          error: uploadError.message
        });
      }
    }

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { 
        $push: { updates: updateData },
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Campaign update added successfully',
      data: campaign
    });

  } catch (error) {
    console.error('Error adding campaign update:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding campaign update',
      error: error.message
    });
  }
};

// Get campaign statistics (Admin only)
const getCampaignStats = async (req, res) => {
  try {
    const stats = await Campaign.aggregate([
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalCampaigns: { $sum: 1 },
                totalGoalAmount: { $sum: '$goalAmount' },
                totalCurrentAmount: { $sum: '$currentAmount' },
                totalDonors: { $sum: '$donorCount' }
              }
            }
          ],
          statusStats: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          categoryStats: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
                totalRaised: { $sum: '$currentAmount' }
              }
            }
          ],
          monthlyStats: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 },
                totalRaised: { $sum: '$currentAmount' }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign statistics',
      error: error.message
    });
  }
};

export {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addCampaignUpdate,
  getCampaignStats
};
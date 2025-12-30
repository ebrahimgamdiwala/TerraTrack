import { createCheckoutSession, retrieveSession } from '../services/stripeService.js';
import Campaign from '../models/campaign.model.js';
import Donation from '../models/donation.model.js';
import User from '../models/user.model.js';
import crypto from 'crypto';

export const createStripeCheckoutSession = async (req, res) => {
  try {
    console.log('Stripe checkout request received:', req.body);
    console.log('User ID from auth:', req.userId);
    
    const { campaignId, amount, campaignTitle } = req.body;
    const userId = req.userId;

    // Validate input
    if (!campaignId || !amount || amount <= 0) {
      console.log('Validation failed:', { campaignId, amount });
      return res.status(400).json({ 
        success: false, 
        message: 'Campaign ID and valid amount are required' 
      });
    }

    // Validate amount is reasonable (minimum $0.50)
    if (amount < 50) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum donation amount is $0.50' 
      });
    }

    console.log('Fetching campaign with ID:', campaignId);
    // Check if campaign exists and is active
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      console.log('Campaign not found:', campaignId);
      return res.status(404).json({ 
        success: false, 
        message: 'Campaign not found' 
      });
    }
    
    if (campaign.status !== 'active') {
      console.log('Campaign not active:', campaign.status);
      return res.status(400).json({ 
        success: false, 
        message: 'Campaign is not active' 
      });
    }

    console.log('Fetching user with ID:', userId);
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('Creating Stripe checkout session...');
    // Create Stripe checkout session
    const session = await createCheckoutSession(
      campaignId,
      amount, // Amount is already in cents from client
      campaignTitle || campaign.title,
      user.email
    );

    console.log('Checkout session created successfully:', session.id);
    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: 'Card error: ' + error.message,
        error: error.message
      });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: ' + error.message,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error.message
    });
  }
};

export const handlePaymentSuccess = async (req, res) => {
  try {
    console.log('🎉 Payment success handler called');
    console.log('📄 Request body:', req.body);
    console.log('👤 User ID:', req.userId);
    
    const { sessionId } = req.body;
    const userId = req.userId;

    if (!sessionId) {
      console.log('❌ No session ID provided');
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    console.log('🔍 Retrieving Stripe session:', sessionId);
    // Retrieve session from Stripe
    const session = await retrieveSession(sessionId);
    console.log('💳 Stripe session retrieved:', session?.id, 'Status:', session?.payment_status);

    if (!session || session.payment_status !== 'paid') {
      console.log('❌ Payment not completed or session invalid');
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    const campaignId = session.metadata.campaignId;
    const amount = session.amount_total / 100; // Convert from cents
    console.log('💰 Processing donation - Campaign:', campaignId, 'Amount:', amount);

    // Check if donation already exists
    console.log('🔍 Checking for existing donation...');
    const existingDonation = await Donation.findOne({ 
      stripeSessionId: sessionId 
    });
    console.log('📊 Existing donation found:', !!existingDonation);

    if (existingDonation) {
      console.log('✅ Donation already exists, returning existing record');
      return res.status(200).json({
        success: true,
        message: 'Donation already processed',
        donation: existingDonation
      });
    }

    console.log('💾 Creating new donation record...');
    
    // Generate unique IDs
    const transactionId = `txn_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const receiptId = `rcpt_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    console.log('🆔 Generated transaction ID:', transactionId);
    console.log('🧾 Generated receipt ID:', receiptId);
    
    // Create donation record
    const donation = new Donation({
      userId,
      campaignId,
      amount,
      paymentMethod: 'stripe',
      transactionId,
      receiptId,
      stripeSessionId: sessionId,
      stripePaymentIntentId: session.payment_intent,
      status: 'completed',
      processedAt: new Date(),
      donationDate: new Date()
    });

    console.log('💾 Saving donation to database...');
    await donation.save();
    console.log('✅ Donation saved successfully');

    console.log('📈 Updating campaign raised amount...');
    // Update campaign raised amount
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { currentAmount: amount }
    });
    console.log('✅ Campaign updated successfully');

    console.log('🎉 Payment success processing completed');
    res.status(200).json({
      success: true,
      message: 'Donation processed successfully',
      donation
    });

  } catch (error) {
    console.error('❌ Payment success handling error:', error);
    console.error('🔍 Error stack:', error.stack);
    console.error('🔍 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to process payment success',
      error: error.message
    });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const session = await retrieveSession(sessionId);

    res.status(200).json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email
      }
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};
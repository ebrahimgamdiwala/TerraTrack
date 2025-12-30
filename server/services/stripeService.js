import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Use a specific API version
});

export const createCheckoutSession = async (campaignId, amount, campaignTitle, userEmail) => {
  try {
    console.log('Creating Stripe session with:', { campaignId, amount, campaignTitle, userEmail });
    console.log('Stripe secret key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('CLIENT_URL:', process.env.CLIENT_URL);
    
    // Validate inputs
    if (!campaignId || !amount || !campaignTitle || !userEmail) {
      throw new Error('Missing required parameters for checkout session');
    }
    
    if (amount < 50) { // Stripe minimum is $0.50
      throw new Error('Amount must be at least $0.50');
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Donation to ${campaignTitle}`,
              description: `Environmental campaign donation`,
            },
            unit_amount: Math.round(amount), // Ensure it's an integer
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&campaign_id=${campaignId}`,
      cancel_url: `${process.env.CLIENT_URL}/campaigns/${campaignId}`,
      customer_email: userEmail,
      metadata: {
        campaignId: campaignId.toString(),
        donationType: 'campaign_donation'
      }
    });

    console.log('Stripe session created successfully:', session.id);
    return session;
  } catch (error) {
    console.error('Stripe session creation error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode
    });
    throw error;
  }
};

export const retrieveSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Stripe session retrieval error:', error);
    throw error;
  }
};

export const handleWebhook = async (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
};

export default stripe;
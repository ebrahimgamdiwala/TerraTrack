import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY).catch(error => {
  console.warn('Stripe initialization failed (possibly blocked by ad blocker):', error);
  return null;
});

export const createCheckoutSession = async (campaignId, amount, campaignTitle) => {
  try {
    const response = await fetch('http://localhost:8080/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        campaignId,
        amount: Math.round(amount * 100), // Convert to cents
        campaignTitle
      })
    });

    if (!response.ok) {
      // Get the actual error message from the server
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('❌ Server error:', errorData);
      } catch (parseError) {
        console.error('❌ Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const session = await response.json();
    
    // Check if we have a direct checkout URL from the server
    if (session.url) {
      // Direct redirect to Stripe Checkout URL
      window.location.href = session.url;
      return { success: true };
    }
    
    // Fallback to client-side redirect if Stripe JS is available
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe is not available. Please disable ad blockers and try again.');
    }
    
    const result = await stripe.redirectToCheckout({
      sessionId: session.sessionId
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result;
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
};

export const handlePaymentSuccess = async (sessionId) => {
  try {
    const response = await fetch('http://localhost:8080/api/stripe/payment-success', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ sessionId })
    });

    if (!response.ok) {
      // Get the actual error message from the server
      let errorMessage = 'Failed to process payment success';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('❌ Server error response:', errorData);
      } catch (parseError) {
        console.error('❌ Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Payment success handling error:', error);
    throw error;
  }
};

export default stripePromise;
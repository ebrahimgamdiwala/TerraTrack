import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { handlePaymentSuccess } from '../services/stripeService';
import { useAuth } from '../context/AuthContext';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [donationDetails, setDonationDetails] = useState(null);

  const sessionId = searchParams.get('session_id');
  const campaignId = searchParams.get('campaign_id');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!sessionId) {
      setError('Invalid payment session');
      setLoading(false);
      return;
    }

    processPaymentSuccess();
  }, [sessionId, user]);

  const processPaymentSuccess = async () => {
    try {
      setLoading(true);
      const response = await handlePaymentSuccess(sessionId);
      
      if (response.success) {
        setSuccess(true);
        setDonationDetails(response.donation);
      } else {
        setError(response.message || 'Payment processing failed');
      }
    } catch (err) {
      console.error('Payment success processing error:', err);
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-white">Processing your donation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Payment Failed</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              to={campaignId ? `/campaigns/${campaignId}` : '/campaigns'}
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {campaignId ? 'Back to Campaign' : 'View Campaigns'}
            </Link>
            <Link
              to="/dashboard"
              className="block w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
          <div className="text-green-400 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-4">Donation Successful!</h1>
          <p className="text-gray-300 mb-6">
            Thank you for your generous contribution to environmental conservation!
          </p>
          
          {donationDetails && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-3">Donation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">${donationDetails.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date:</span>
                  <span className="text-white">
                    {new Date(donationDetails.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 capitalize">{donationDetails.status}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              to={campaignId ? `/campaigns/${campaignId}` : '/campaigns'}
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {campaignId ? 'Back to Campaign' : 'View More Campaigns'}
            </Link>
            <Link
              to="/dashboard"
              className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccessPage;
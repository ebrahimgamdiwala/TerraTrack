import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { donationService, campaignHelpers } from '../services/campaignService';
import { useAuth } from '../context/AuthContext';

const DonationHistoryPage = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalDonated: 0,
    campaignsSupported: 0,
    averageDonation: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserDonations();
    }
  }, [user]);

  const fetchUserDonations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching user donations...');
      const response = await donationService.getUserDonations();
      console.log('📊 Full API response:', JSON.stringify(response, null, 2));
      console.log('📊 Response structure keys:', Object.keys(response || {}));
      console.log('📊 Response.data:', response.data);
      console.log('📊 Response.success:', response.success);
      
      // The service returns the backend response directly: { success: true, data: [...], pagination: {...} }
      // So donations are in response.data
      const donationsData = response.data || [];
      console.log('💰 Donations array:', donationsData);
      console.log('📊 Number of donations found:', donationsData.length);
      setDonations(donationsData);
      
      // Calculate stats
      if (donationsData.length > 0) {
        const totalDonated = donationsData.reduce((sum, donation) => sum + donation.amount, 0);
        const uniqueCampaigns = new Set(donationsData.map(d => d.campaignId._id));
        
        setStats({
          totalDonated,
          campaignsSupported: uniqueCampaigns.size,
          averageDonation: totalDonated / donationsData.length
        });
      }
    } catch (err) {
      setError('Failed to load donation history');
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (donationId) => {
    try {
      const response = await donationService.getDonationReceipt(donationId);
      
      // Create a blob from the receipt data and trigger download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `donation-receipt-${donationId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading receipt:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-8">Please login to view your donation history.</p>
            <Link
              to="/login"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading your donation history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Donations</h1>
          <p className="text-gray-400">Track your environmental impact and support history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-900 text-green-400">
                💰
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Donated</p>
                <p className="text-2xl font-bold text-white">
                  {campaignHelpers.formatCurrency(stats.totalDonated)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-900 text-blue-400">
                🌱
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Campaigns Supported</p>
                <p className="text-2xl font-bold text-white">{stats.campaignsSupported}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-900 text-purple-400">
                📊
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Average Donation</p>
                <p className="text-2xl font-bold text-white">
                  {campaignHelpers.formatCurrency(stats.averageDonation)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Donations List */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Donation History</h2>
          </div>

          {(() => {
            console.log('🎯 Rendering donations:', donations);
            console.log('🎯 Donations type:', typeof donations);
            console.log('🎯 Donations length:', donations?.length);
            console.log('🎯 Is array?', Array.isArray(donations));
            return null;
          })()}

          {donations && donations.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {donations.map((donation) => (
                <div key={donation._id} className="p-6 hover:bg-gray-800 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <img
                          src={donation.campaignId.imageUrl || '/api/placeholder/80/80'}
                          alt={donation.campaignId.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-white mb-1">
                            <Link
                              to={`/campaigns/${donation.campaignId._id}`}
                              className="hover:text-green-400 transition-colors duration-200"
                            >
                              {donation.campaignId.title}
                            </Link>
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>
                              {campaignHelpers.getCategoryIcon(donation.campaignId.category)} {campaignHelpers.getCategoryName(donation.campaignId.category)}
                            </span>
                            <span>•</span>
                            <span>{campaignHelpers.formatDate(donation.donationDate || donation.createdAt)}</span>
                          </div>
                          {donation.message && (
                            <p className="text-sm text-gray-400 mt-2 italic">"{donation.message}"</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {campaignHelpers.formatCurrency(donation.amount)}
                      </div>
                      <div className="space-y-2">
                        <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          donation.paymentStatus === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : donation.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {donation.paymentStatus.charAt(0).toUpperCase() + donation.paymentStatus.slice(1)}
                        </div>
                        <div className="block">
                          <button
                            onClick={() => downloadReceipt(donation._id)}
                            className="text-sm text-green-600 hover:text-green-700 font-medium"
                          >
                            Download Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
                      <div>
                        <span className="font-medium">Payment Method:</span>
                        <div className="mt-1 capitalize">{donation.paymentMethod.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="font-medium">Transaction ID:</span>
                        <div className="mt-1 font-mono text-xs">{donation.transactionId}</div>
                      </div>
                      <div>
                        <span className="font-medium">Receipt ID:</span>
                        <div className="mt-1 font-mono text-xs">{donation.receiptId}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">💖</div>
              <h3 className="text-xl font-medium text-white mb-2">No donations yet</h3>
              <p className="text-gray-400 mb-6">
                Start making a difference by supporting environmental campaigns!
              </p>
              <Link
                to="/campaigns"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Browse Campaigns
              </Link>
            </div>
          )}
        </div>

        {/* Impact Summary */}
        {donations && donations.length > 0 && (
          <div className="mt-8 bg-green-900 bg-opacity-20 border border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Your Environmental Impact</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">🌳</div>
                <div className="text-sm text-green-300 mt-1">Supporting Reforestation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">🌊</div>
                <div className="text-sm text-green-300 mt-1">Ocean Conservation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">⚡</div>
                <div className="text-sm text-green-300 mt-1">Clean Energy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">🦋</div>
                <div className="text-sm text-green-300 mt-1">Wildlife Protection</div>
              </div>
            </div>
            <p className="text-green-300 text-center mt-4">
              Thank you for being part of the solution! Your {donations?.length || 0} donation{(donations?.length || 0) !== 1 ? 's' : ''} are making a real difference for our planet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationHistoryPage;
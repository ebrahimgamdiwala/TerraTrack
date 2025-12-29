import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { campaignService, donationService, campaignHelpers } from '../services/campaignService';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';
import { toastUtils } from '../utils/toast';
import toast from 'react-hot-toast';
import WalletConnect from '../components/WalletConnect';

const CampaignDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { account, isConnected, connectWallet, blockchainService } = useWeb3();
  
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donationLoading, setDonationLoading] = useState(false);
  const [error, setError] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [blockchainAmount, setBlockchainAmount] = useState(0);

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  useEffect(() => {
    if (campaign) {
      fetchCampaignDonations();
      fetchBlockchainAmount();
    }
  }, [campaign, isConnected]);

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      console.log('Fetching campaign with ID:', id);
      const response = await campaignService.getCampaignById(id);
      console.log('Campaign API response:', response);
      
      if (response && response.data) {
        setCampaign(response.data);
        console.log('Set campaign data:', response.data);
      } else {
        console.log('No data in campaign response:', response);
        setError('Campaign data not found');
      }
    } catch (err) {
      setError('Failed to load campaign details');
      console.error('Error fetching campaign:', err);
      console.error('Error details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockchainAmount = async () => {
    try {
      if (blockchainService && isConnected) {
        const blockchainId = campaign?.blockchainId ?? 0;
        const campaigns = await blockchainService.getCampaigns();
        console.log('All blockchain campaigns:', campaigns);
        
        if (campaigns[blockchainId]) {
          const amount = parseFloat(campaigns[blockchainId].amountCollected);
          console.log('Blockchain amount collected:', amount);
          setBlockchainAmount(amount);
        }
      }
    } catch (error) {
      console.error('Error fetching blockchain amount:', error);
    }
  };

  const fetchCampaignDonations = async () => {
    try {
      // Fetch from database
      const response = await donationService.getCampaignDonations(id, { limit: 1000 });
      console.log('Donations API response:', response);
      
      let dbDonations = [];
      if (response && response.data) {
        dbDonations = Array.isArray(response.data) ? response.data : [];
      }

      // Try to fetch blockchain donations if wallet is connected
      try {
        if (blockchainService && isConnected) {
          // Use blockchainId from campaign or default to 0
          const blockchainId = campaign?.blockchainId ?? 0;
          console.log('Fetching blockchain donations for campaign ID:', blockchainId);
          
          const blockchainDonations = await blockchainService.getDonators(blockchainId);
          console.log('Blockchain donations fetched:', blockchainDonations);
          
          // Merge blockchain donations with database donations
          const mergedDonations = [...dbDonations];
          
          blockchainDonations.forEach((bdonate, index) => {
            // Create a donation object for blockchain donations
            const blockchainDonation = {
              _id: `blockchain_${blockchainId}_${index}_${bdonate.address}`,
              walletAddress: bdonate.address,
              amount: parseFloat(bdonate.amount),
              createdAt: new Date(),
              isAnonymous: false,
              donorName: `${bdonate.address.substring(0, 6)}...${bdonate.address.substring(38)}`
            };
            
            // Check if this exact donation already exists in DB (by wallet + amount)
            const existsInDb = dbDonations.some(
              d => d.walletAddress === bdonate.address && 
                   Math.abs((d.amount || 0) - parseFloat(bdonate.amount)) < 0.0001
            );
            
            if (!existsInDb) {
              mergedDonations.push(blockchainDonation);
            }
          });
          
          console.log('Total donations after merge:', mergedDonations.length);
          setDonations(mergedDonations);
        } else {
          console.log('Blockchain service not available or wallet not connected');
          setDonations(dbDonations);
        }
      } catch (blockchainErr) {
        console.error('Error fetching blockchain donations:', blockchainErr);
        console.error('Blockchain error details:', blockchainErr.message);
        // Fall back to database donations only
        setDonations(dbDonations);
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
      setDonations([]); // Ensure donations is always an array
    }
  };

  const handleDonation = async (e) => {
    e.preventDefault();
    
    if (!isConnected || !account) {
      toastUtils.error('Please connect your wallet to donate');
      return;
    }

    if (!donationAmount || donationAmount <= 0) {
      toastUtils.error('Please enter a valid donation amount');
      return;
    }

    try {
      setDonationLoading(true);
      const loadingToast = toastUtils.loading('Please confirm the transaction in MetaMask...');
      
      // Determine campaign blockchain ID
      // If campaign has a blockchainId, use it; otherwise use a default or create one
      const campaignBlockchainId = campaign.blockchainId ?? 0;
      
      // Donate through blockchain
      const receipt = await blockchainService.donateToCampaign(
        campaignBlockchainId,
        donationAmount
      );
      
      toast.dismiss(loadingToast);
      toastUtils.success(`Donation successful! Transaction: ${receipt.hash.substring(0, 10)}...`);
      
      // Record donation in database for tracking (optional - blockchain is source of truth)
      try {
        if (user) {
          const donationData = {
            campaignId: campaign._id,
            amount: parseFloat(donationAmount),
            donorName: user.name || account,
            donorEmail: user.email || `${account}@blockchain.local`,
            isAnonymous: false,
            paymentMethod: 'crypto',
            paymentProcessor: 'blockchain',
            transactionId: receipt.hash,
            processorTransactionId: receipt.hash,
            status: 'completed'
          };
          
          console.log('Recording donation in database:', donationData);
          const dbResponse = await donationService.createDonation(donationData);
          console.log('Database donation response:', dbResponse);
        } else {
          console.log('Skipping database recording - user not logged in. Blockchain transaction is sufficient.');
        }
      } catch (dbError) {
        console.error('Error recording donation in database:', dbError);
        console.error('Database error details:', dbError.response?.data || dbError.message);
        // Don't fail the whole operation if database recording fails - blockchain is source of truth
      }
      
      // Refresh campaign data and donations
      await fetchCampaignDetails();
      await fetchBlockchainAmount();
      await fetchCampaignDonations();
      
      // Reset form
      setDonationAmount('');
      setShowDonationForm(false);
      
    } catch (err) {
      console.error('Donation error:', err);
      
      if (err.code === 'ACTION_REJECTED' || err.message?.includes('user rejected')) {
        toastUtils.error('Transaction was rejected');
      } else if (err.message?.includes('insufficient funds')) {
        toastUtils.error('Insufficient ETH balance in your wallet');
      } else {
        toastUtils.error(err.message || 'Failed to process donation');
      }
    } finally {
      setDonationLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      await campaignService.deleteCampaign(id);
      toastUtils.success('Campaign deleted successfully');
      navigate('/campaigns');
    } catch (err) {
      toastUtils.error(err.message || 'Failed to delete campaign');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-12 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading campaign details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen pt-32 pb-12 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">Campaign Not Found</h1>
            <p className="text-gray-300 mb-8">{error || 'The campaign you are looking for does not exist.'}</p>
            <Link
              to="/campaigns"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = campaignHelpers.getProgressPercentage(campaign.currentAmount, campaign.goalAmount);
  const daysRemaining = campaignHelpers.getDaysRemaining(campaign.endDate);

  return (
    <div className="min-h-screen pt-32 pb-12 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-400">
            <li>
              <Link to="/campaigns" className="hover:text-green-400">Campaigns</Link>
            </li>
            <li>/</li>
            <li className="text-white truncate">{campaign.title}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero Image */}
            <div className="relative mb-8">
              <img
                src={campaign.imageUrl || '/api/placeholder/800/400'}
                alt={campaign.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${campaignHelpers.getStatusColor(campaign.status)}`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <span className="bg-gray-900 bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-200">
                  {campaignHelpers.getCategoryIcon(campaign.category)} {campaignHelpers.getCategoryName(campaign.category)}
                </span>
              </div>
            </div>

            {/* Campaign Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-white">{campaign.title}</h1>
                {user?.isAdmin && (
                  <div className="flex space-x-2">
                    <Link
                      to={`/campaigns/${id}/edit`}
                      className="text-blue-400 hover:text-blue-300 px-3 py-1 border border-blue-600 rounded text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={handleDeleteCampaign}
                      className="text-red-400 hover:text-red-300 px-3 py-1 border border-red-600 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="text-gray-300 mb-6 whitespace-pre-line">
                {campaign.description}
              </div>

              {/* Campaign Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-white mb-2">Campaign Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Start Date:</span>
                      <span className="text-gray-300">{campaignHelpers.formatDate(campaign.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">End Date:</span>
                      <span className="text-gray-300">{campaignHelpers.formatDate(campaign.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-gray-300">{campaign.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Impact Goals</h3>
                  <div className="space-y-2 text-sm">
                    {campaign.impactMetrics?.measurableGoals?.length > 0 ? (
                      campaign.impactMetrics.measurableGoals.map((metric, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-400">{metric.metric}:</span>
                          <span className="text-gray-300">{metric.target}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">No impact goals defined</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Updates */}
              {campaign.updates && campaign.updates.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-4">Campaign Updates</h3>
                  <div className="space-y-4">
                    {campaign.updates.slice(0, 3).map((update, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{update.title}</h4>
                          <span className="text-sm text-gray-400">
                            {campaignHelpers.formatDate(update.date)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{update.content}</p>
                        {update.image && (
                          <img
                            src={update.image}
                            alt={update.title}
                            className="mt-2 w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Funding Progress */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-6 mb-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">
                  {blockchainAmount > 0 ? `${blockchainAmount.toFixed(4)} ETH` : campaignHelpers.formatCurrency(campaign.currentAmount)}
                </div>
                <div className="text-gray-300">
                  raised of {campaignHelpers.formatCurrency(campaign.goalAmount)} goal
                </div>
                {blockchainAmount > 0 && (
                  <div className="text-xs text-emerald-400 mt-1">
                    ≈ ${(blockchainAmount * 3000).toFixed(2)} USD
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{progressPercentage}% funded</span>
                  <span>{daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}</span>
                </div>
              </div>

              {/* Donate Button */}
              {!showDonationForm ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowDonationForm(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-colors duration-200 font-medium"
                  >
                    Donate with ETH
                  </button>
                  <div className="text-xs text-center text-white/50">
                    Donations are processed on Sepolia testnet
                  </div>
                </div>
              ) : (
                <div>
                  {!isConnected ? (
                    <div className="space-y-3">
                      <WalletConnect className="w-full" />
                      <button
                        type="button"
                        onClick={() => setShowDonationForm(false)}
                        className="w-full px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleDonation} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Donation Amount (ETH)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">Ξ</span>
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400"
                            placeholder="0.01"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Your wallet: {account?.substring(0, 6)}...{account?.substring(38)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={donationLoading}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-colors duration-200 font-medium disabled:opacity-50"
                        >
                          {donationLoading ? 'Processing...' : 'Confirm Donation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDonationForm(false);
                            setDonationAmount('');
                          }}
                          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
              
              {!user && (
                <p className="text-sm text-gray-300 mt-4 text-center">
                  <Link to="/login" className="text-green-400 hover:text-green-300">
                    Login
                  </Link> to make a donation
                </p>
              )}
            </div>

            {/* Recent Donations */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-6">
              <h3 className="font-semibold text-white mb-4">
                Recent Donations {donations && donations.length > 0 && `(${donations.length})`}
              </h3>
              {donations && donations.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {donations.map((donation) => (
                    <div key={donation._id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                      <div>
                        <div className="font-medium text-white">
                          {donation.isAnonymous ? 'Anonymous' : donation.donorName || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-400">
                          {campaignHelpers.formatDate(donation.createdAt)}
                        </div>
                        {donation.walletAddress && (
                          <div className="text-xs text-gray-500 font-mono">
                            {donation.walletAddress.substring(0, 6)}...{donation.walletAddress.substring(38)}
                          </div>
                        )}
                      </div>
                      <div className="font-medium text-emerald-400">
                        {donation.amount ? `${donation.amount} ETH` : campaignHelpers.formatCurrency(donation.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No donations yet. Be the first to support this campaign!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsPage;
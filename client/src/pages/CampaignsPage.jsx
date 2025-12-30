import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignService, campaignHelpers } from '../services/campaignService';
import { useAuth } from '../context/AuthContext';

const CampaignsPage = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const categories = [
    'reforestation',
    'ocean-cleanup',
    'renewable-energy',
    'wildlife-conservation',
    'climate-action',
    'water-conservation',
    'sustainable-agriculture',
    'pollution-control',
    'biodiversity',
    'green-technology'
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Newest First' },
    { value: '-createdAt', label: 'Oldest First' },
    { value: 'goalAmount', label: 'Funding Goal' },
    { value: 'raisedAmount', label: 'Amount Raised' },
    { value: 'title', label: 'Name A-Z' }
  ];

  useEffect(() => {
    fetchCampaigns();
  }, [filters, currentPage]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const params = {
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      console.log('Fetching campaigns with params:', params);
      const response = await campaignService.getAllCampaigns(params);
      console.log('Campaigns API response:', response);
      
      if (response && response.data) {
        // Backend returns campaigns directly in data, not data.campaigns
        setCampaigns(response.data || []);
        setTotalCampaigns(response.pagination?.totalCampaigns || 0);
        console.log('Set campaigns:', response.data);
      } else {
        console.log('No data in response:', response);
        setCampaigns([]);
        setTotalCampaigns(0);
      }
    } catch (err) {
      setError('Failed to load campaigns');
      console.error('Error fetching campaigns:', err);
      setCampaigns([]);
      setTotalCampaigns(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCampaigns();
  };

  const totalPages = Math.ceil(totalCampaigns / itemsPerPage);

  const CampaignCard = ({ campaign }) => {
    const progressPercentage = campaignHelpers.getProgressPercentage(campaign.raisedAmount, campaign.goalAmount);
    const daysRemaining = campaignHelpers.getDaysRemaining(campaign.endDate);
    
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:border-gray-700 transition-all duration-300">
        <div className="relative">
          <img
            src={campaign.imageUrl || '/api/placeholder/400/240'}
            alt={campaign.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${campaignHelpers.getStatusColor(campaign.status)}`}>
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <span className="bg-black/70 px-2 py-1 rounded-full text-xs font-medium text-gray-200">
              {campaignHelpers.getCategoryIcon(campaign.category)} {campaignHelpers.getCategoryName(campaign.category)}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
            {campaign.title}
          </h3>
          
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {campaign.description}
          </p>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Raised: {campaignHelpers.formatCurrency(campaign.raisedAmount)}</span>
              <span>Goal: {campaignHelpers.formatCurrency(campaign.goalAmount)}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{progressPercentage}% funded</span>
              <span>{daysRemaining} days left</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span>{campaign.donorCount || 0} donors</span>
            </div>
            <Link
              to={`/campaigns/${campaign._id}`}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading && (!campaigns || campaigns.length === 0)) {
    return (
      <div className="min-h-screen pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Environmental Campaigns
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join our mission to protect and restore our planet. Support campaigns that make a real difference in environmental conservation.
          </p>
        </div>

        {/* Admin Create Button */}
        {user?.role === 'ADMIN' && (
          <div className="mb-8 flex justify-end">
            <Link
              to="/campaigns/create"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Create New Campaign
            </Link>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-4 md:space-y-0 md:grid md:grid-cols-6 md:gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {campaignHelpers.getCategoryIcon(category)} {campaignHelpers.getCategoryName(category)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {campaigns?.length || 0} of {totalCampaigns} campaigns
          </p>
        </div>

        {/* Campaigns Grid */}
        {campaigns && campaigns.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {campaigns.map(campaign => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-medium text-white mb-2">No campaigns found</h3>
            <p className="text-gray-400">
              {filters.search || filters.category || filters.status
                ? "Try adjusting your filters to see more campaigns."
                : "Be the first to create an environmental campaign!"
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 border rounded-lg ${
                      currentPage === page
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-700 bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page} className="px-2 text-gray-400">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsPage;
import api from '../utils/api';

// Campaign API service
export const campaignService = {
  // Get all campaigns with filters
  getAllCampaigns: async (params = {}) => {
    try {
      const response = await api.get('/api/campaigns', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get campaign by ID
  getCampaignById: async (id) => {
    try {
      const response = await api.get(`/api/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new campaign (Admin only)
  createCampaign: async (campaignData, imageFile) => {
    try {
      const formData = new FormData();
      
      // Append all campaign data
      Object.keys(campaignData).forEach(key => {
        if (campaignData[key] !== null && campaignData[key] !== undefined) {
          if (typeof campaignData[key] === 'object') {
            formData.append(key, JSON.stringify(campaignData[key]));
          } else {
            formData.append(key, campaignData[key]);
          }
        }
      });

      // Append image if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post('/api/campaigns', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update campaign (Admin only)
  updateCampaign: async (id, campaignData, imageFile) => {
    try {
      const formData = new FormData();
      
      // Append all campaign data
      Object.keys(campaignData).forEach(key => {
        if (campaignData[key] !== null && campaignData[key] !== undefined) {
          if (typeof campaignData[key] === 'object') {
            formData.append(key, JSON.stringify(campaignData[key]));
          } else {
            formData.append(key, campaignData[key]);
          }
        }
      });

      // Append image if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.put(`/api/campaigns/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete campaign (Admin only)
  deleteCampaign: async (id) => {
    try {
      const response = await api.delete(`/api/campaigns/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Add campaign update (Admin only)
  addCampaignUpdate: async (id, updateData, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('title', updateData.title);
      formData.append('content', updateData.content);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await api.post(`/api/campaigns/${id}/updates`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get campaign statistics
  getCampaignStats: async () => {
    try {
      const response = await api.get('/api/campaigns/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Donation API service
export const donationService = {
  // Create donation
  createDonation: async (donationData) => {
    try {
      const response = await api.post('/api/donations', donationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get campaign donations
  getCampaignDonations: async (campaignId, params = {}) => {
    try {
      const response = await api.get(`/api/donations/campaign/${campaignId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user's donations
  getUserDonations: async (params = {}) => {
    try {
      const response = await api.get('/api/donations/my-donations', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get donation by ID
  getDonationById: async (id) => {
    try {
      const response = await api.get(`/api/donations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get donation receipt
  getDonationReceipt: async (id) => {
    try {
      const response = await api.get(`/api/donations/${id}/receipt`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get donation statistics (Admin only)
  getDonationStats: async (params = {}) => {
    try {
      const response = await api.get('/api/donations/stats/overview', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Helper functions
export const campaignHelpers = {
  // Format currency
  formatCurrency: (amount, currency = 'USD') => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(numAmount);
  },

  // Format date
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Get campaign status badge color
  getStatusColor: (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.active;
  },

  // Get category icon
  getCategoryIcon: (category) => {
    const icons = {
      'reforestation': '🌳',
      'ocean-cleanup': '🌊',
      'renewable-energy': '⚡',
      'wildlife-conservation': '🦋',
      'climate-action': '🌍',
      'water-conservation': '💧',
      'sustainable-agriculture': '🌾',
      'pollution-control': '🏭',
      'biodiversity': '🌿',
      'green-technology': '🔬'
    };
    return icons[category] || '🌱';
  },

  // Get category display name
  getCategoryName: (category) => {
    const names = {
      'reforestation': 'Reforestation',
      'ocean-cleanup': 'Ocean Cleanup',
      'renewable-energy': 'Renewable Energy',
      'wildlife-conservation': 'Wildlife Conservation',
      'climate-action': 'Climate Action',
      'water-conservation': 'Water Conservation',
      'sustainable-agriculture': 'Sustainable Agriculture',
      'pollution-control': 'Pollution Control',
      'biodiversity': 'Biodiversity',
      'green-technology': 'Green Technology'
    };
    return names[category] || 'Environmental';
  },

  // Calculate days remaining
  getDaysRemaining: (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  },

  // Get progress percentage
  getProgressPercentage: (current, goal) => {
    const numCurrent = Number(current) || 0;
    const numGoal = Number(goal) || 1; // Avoid division by zero
    if (numGoal === 0) return 0;
    return Math.min(Math.round((numCurrent / numGoal) * 100), 100);
  }
};
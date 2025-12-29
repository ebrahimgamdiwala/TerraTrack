import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignService, campaignHelpers } from '../services/campaignService';
import { useAuth } from '../context/AuthContext';
import { toastUtils } from '../utils/toast';

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    goalAmount: '',
    startDate: '',
    endDate: '',
    location: '',
    organizer: '',
    organizerEmail: '',
    expectedImpact: '',
    targetMetrics: [{ name: '', target: '', unit: '' }]
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/campaigns');
      toastUtils.error('Access denied. Admin privileges required.');
    }
  }, [user, navigate]);

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

  const metricUnits = [
    'trees',
    'acres',
    'tons',
    'kWh',
    'gallons',
    'species',
    'miles',
    'kg',
    'hectares',
    'cubic meters'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toastUtils.error('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMetricChange = (index, field, value) => {
    const newMetrics = [...formData.targetMetrics];
    newMetrics[index][field] = value;
    setFormData(prev => ({
      ...prev,
      targetMetrics: newMetrics
    }));
  };

  const addMetric = () => {
    setFormData(prev => ({
      ...prev,
      targetMetrics: [...prev.targetMetrics, { name: '', target: '', unit: '' }]
    }));
  };

  const removeMetric = (index) => {
    if (formData.targetMetrics.length > 1) {
      const newMetrics = formData.targetMetrics.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        targetMetrics: newMetrics
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toastUtils.error('Campaign title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toastUtils.error('Campaign description is required');
      return;
    }
    
    if (!formData.shortDescription.trim()) {
      toastUtils.error('Short description is required');
      return;
    }
    
    if (!formData.organizer.trim()) {
      toastUtils.error('Organizer name is required');
      return;
    }
    
    if (!formData.organizerEmail.trim()) {
      toastUtils.error('Organizer email is required');
      return;
    }
    
    if (!formData.expectedImpact.trim()) {
      toastUtils.error('Expected impact description is required');
      return;
    }
    
    if (!formData.category) {
      toastUtils.error('Please select a category');
      return;
    }
    
    if (!formData.goalAmount || formData.goalAmount <= 0) {
      toastUtils.error('Please enter a valid funding goal');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      toastUtils.error('Please select start and end dates');
      return;
    }
    
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toastUtils.error('End date must be after start date');
      return;
    }

    // Clean up target metrics - remove empty ones
    const cleanMetrics = formData.targetMetrics.filter(
      metric => metric.name.trim() && metric.target && metric.unit
    );

    try {
      setLoading(true);
      
      const campaignData = {
        ...formData,
        goalAmount: parseFloat(formData.goalAmount),
        targetMetrics: cleanMetrics
      };

      const response = await campaignService.createCampaign(campaignData, imageFile);
      
      toastUtils.success('Campaign created successfully!');
      navigate(`/campaigns/${response.data._id}`);
      
    } catch (err) {
      toastUtils.error(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null; // Component will redirect
  }

  return (
    <div className="min-h-screen pt-32 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10">
            <h1 className="text-2xl font-bold text-white">Create New Campaign</h1>
            <p className="text-white/70 mt-1">Create an environmental campaign to make a positive impact.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-white/40"
                  placeholder="Enter campaign title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Short Description *
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-white/40"
                  placeholder="Brief summary of your campaign (max 200 characters)"
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="" className="bg-gray-900">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-gray-900">
                      {campaignHelpers.getCategoryIcon(category)} {campaignHelpers.getCategoryName(category)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Funding Goal ($) *
                </label>
                <input
                  type="number"
                  name="goalAmount"
                  value={formData.goalAmount}
                  onChange={handleInputChange}
                  min="1"
                  step="0.01"
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-white/40"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Amazon Rainforest, Brazil"
                />
              </div>
            </div>

            {/* Organizer Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Organizer Name *
                </label>
                <input
                  type="text"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Your name or organization"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  name="organizerEmail"
                  value={formData.organizerEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="contact@example.com"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Describe your campaign, its goals, and the environmental impact it will make..."
                required
              />
            </div>

            {/* Expected Impact */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Expected Impact *
              </label>
              <textarea
                name="expectedImpact"
                value={formData.expectedImpact}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Describe the expected environmental impact of this campaign..."
                required
              />
            </div>

            {/* Campaign Image */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Campaign Image
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 bg-white/5 backdrop-blur-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="text-center">
                      <img
                        src={imagePreview}
                        alt="Campaign preview"
                        className="mx-auto h-32 w-auto object-cover rounded"
                      />
                      <p className="mt-2 text-sm text-white/60">Click to change image</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-white/40 text-4xl mb-2">📸</div>
                      <div className="text-sm text-white/70">
                        <span className="font-medium text-emerald-400">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-white/40 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Target Metrics */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-white/80">
                  Impact Goals
                </label>
                <button
                  type="button"
                  onClick={addMetric}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                >
                  + Add Goal
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.targetMetrics.map((metric, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={metric.name}
                        onChange={(e) => handleMetricChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="e.g., Trees planted"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={metric.target}
                        onChange={(e) => handleMetricChange(index, 'target', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="1000"
                        min="1"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={metric.unit}
                        onChange={(e) => handleMetricChange(index, 'unit', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="" className="bg-gray-900">Unit</option>
                        {metricUnits.map(unit => (
                          <option key={unit} value={unit} className="bg-gray-900">{unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      {formData.targetMetrics.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMetric(index)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-2">
                Define measurable impact goals for your campaign (optional but recommended)
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => navigate('/campaigns')}
                className="px-6 py-2 border border-white/20 rounded-lg text-white/70 hover:bg-white/10 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
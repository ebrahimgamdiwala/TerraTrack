import express from 'express';
import axios from 'axios';
import FormData from 'form-data';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Satellite analysis backend URL
const SATELLITE_API_URL = process.env.SATELLITE_API_URL || 'http://localhost:8000';

// Proxy route for satellite analysis
router.post('/analyze', upload.fields([
  { name: 'before_images', maxCount: 13 },
  { name: 'after_images', maxCount: 13 }
]), async (req, res) => {
  try {
    // Forward the request to the satellite analysis backend
    const formData = new FormData();
    
    // Add files and metadata from the request
    if (req.files) {
      if (req.files.before_images) {
        req.files.before_images.forEach(file => {
          formData.append('before_images', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
          });
        });
      }
      
      if (req.files.after_images) {
        req.files.after_images.forEach(file => {
          formData.append('after_images', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype
          });
        });
      }
    }
    
    // Add metadata
    if (req.body.location) formData.append('location', req.body.location);
    if (req.body.date_before) formData.append('date_before', req.body.date_before);
    if (req.body.date_after) formData.append('date_after', req.body.date_after);

    // Forward to satellite analysis backend
    const response = await axios.post(`${SATELLITE_API_URL}/api/analyze`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 180000, // 3 minutes
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    console.error('Satellite analysis error:', error);
    res.status(error.response?.status || 500).json({
      error: 'Satellite analysis failed',
      detail: error.response?.data?.detail || error.message
    });
  }
});

// Proxy route for getting results
router.get('/results/:analysis_id', async (req, res) => {
  try {
    const response = await axios.get(
      `${SATELLITE_API_URL}/api/results/${req.params.analysis_id}`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(error.response?.status || 500).json({
      error: 'Failed to get results',
      detail: error.response?.data?.detail || error.message
    });
  }
});

// Proxy route for getting visualization image
router.get('/results/:analysis_id/image', async (req, res) => {
  try {
    const response = await axios.get(
      `${SATELLITE_API_URL}/api/results/${req.params.analysis_id}/image`,
      { responseType: 'stream' }
    );
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Get image error:', error);
    res.status(error.response?.status || 500).json({
      error: 'Failed to get visualization',
      detail: error.response?.data?.detail || error.message
    });
  }
});

// Proxy route for getting list of individual visualizations
router.get('/results/:analysis_id/visualizations', async (req, res) => {
  try {
    const response = await axios.get(
      `${SATELLITE_API_URL}/api/results/${req.params.analysis_id}/visualizations`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Get visualizations list error:', error);
    res.status(error.response?.status || 500).json({
      error: 'Failed to get visualizations list',
      detail: error.response?.data?.detail || error.message
    });
  }
});

// Proxy route for getting individual visualization image
router.get('/results/:analysis_id/visualizations/:filename', async (req, res) => {
  try {
    const response = await axios.get(
      `${SATELLITE_API_URL}/api/results/${req.params.analysis_id}/visualizations/${req.params.filename}`,
      { responseType: 'stream' }
    );
    
    response.data.pipe(res);
  } catch (error) {
    console.error('Get individual visualization error:', error);
    res.status(error.response?.status || 500).json({
      error: 'Failed to get visualization',
      detail: error.response?.data?.detail || error.message
    });
  }
});

// Health check for satellite backend
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${SATELLITE_API_URL}/health`);
    res.json({
      status: 'connected',
      satellite_backend: response.data
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: 'Satellite analysis backend not available'
    });
  }
});

export default router;

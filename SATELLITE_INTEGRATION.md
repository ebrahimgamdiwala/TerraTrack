# Satellite Image Analysis Integration - TerraBotPage

## Overview
Successfully integrated satellite image change detection into TerraBotPage with a dual-mode interface.

## Features Implemented

### 1. Dual-Mode Interface
- **Chat Mode**: Original chat functionality for text-based climate analysis
- **Satellite Mode**: Upload before/after satellite images for change detection

### 2. Mode Switcher
- Toggle between Chat and Satellite modes
- Clean UI with emerald/teal gradient theme matching existing design

### 3. Satellite Upload Interface
- Location name input (required)
- Before image upload (PNG/JPEG only)
- After image upload (PNG/JPEG only)
- Visual feedback for uploaded files

### 4. Results Display Layout
- **Left Panel (Chat Area)**: 
  - LLM text explanations (executive summary, detailed analysis, environmental impact, recommendations, key insights)
  - User messages and bot responses
  
- **Right Panel (Visualizer Area)**:
  - Satellite analysis metrics cards (Vegetation, Urban, Water)
  - Change detection visualization images (stacked vertically)
  - All other visualizations from chat analysis

### 5. Components Created

#### ChatInputEnhanced.jsx
- Mode switcher (Chat/Satellite)
- Chat input with quick prompts
- Satellite upload form with validation
- Handles both message sending and satellite analysis

#### SatelliteResults.jsx
- Displays satellite analysis metrics
- Vegetation changes (increase/decrease/NDVI)
- Urban development (urbanization/construction/NDBI)
- Water bodies (increase/decrease/net change)
- Key findings summary

### 6. Backend Integration

#### satellite.routes.js
- POST `/api/satellite/analyze` - Proxy to satellite backend
- GET `/api/satellite/results/:analysis_id` - Get analysis results
- GET `/api/satellite/results/:analysis_id/image` - Get visualization image
- GET `/api/satellite/health` - Health check for satellite backend

## API Flow

1. User uploads before/after images in Satellite mode
2. Frontend sends FormData to `/api/satellite/analyze`
3. Server proxies request to satellite backend at `http://localhost:8000`
4. Satellite backend processes images and returns:
   - Analysis ID
   - Metrics (vegetation, urban, water)
   - LLM explanations
5. Frontend displays:
   - LLM text in left chat panel
   - Metrics in right panel (SatelliteResults component)
   - Visualization images in right panel (stacked)

## File Structure

```
TerraTrack/TerraTrack_BitNBuild/
├── client/src/
│   ├── pages/
│   │   └── TerraBotPage.jsx (modified - added satellite integration)
│   └── components/
│       ├── ChatInputEnhanced.jsx (new - dual-mode input)
│       └── SatelliteResults.jsx (new - metrics display)
└── server/
    ├── index.js (modified - added satellite routes)
    └── routes/
        └── satellite.routes.js (new - proxy to satellite backend)
```

## Environment Variables

Add to `.env` file:
```
SATELLITE_API_URL=http://localhost:8000
```

## Testing Instructions

### 1. Start Satellite Backend
```bash
cd TerraTrack/TerraTrack_BitNBuild/satellite-backend
python main.py
```
Backend should run on `http://localhost:8000`

### 2. Start Server
```bash
cd TerraTrack/TerraTrack_BitNBuild/server
npm run dev
```
Server should run on `http://localhost:8080`

### 3. Start Client
```bash
cd TerraTrack/TerraTrack_BitNBuild/client
npm run dev
```
Client should run on `http://localhost:5173`

### 4. Test Satellite Analysis
1. Navigate to TerraBotPage
2. Click "🛰️ Satellite Images" mode
3. Enter location name (e.g., "Dubai")
4. Upload before image (PNG/JPEG)
5. Upload after image (PNG/JPEG)
6. Click "🚀 Analyze Changes"
7. Wait for analysis (may take 1-3 minutes)
8. Verify:
   - LLM explanations appear in left chat panel
   - Metrics cards appear in right panel
   - Visualization images appear below metrics

## Key Features

✅ Dual-mode interface (Chat/Satellite)
✅ PNG/JPEG only validation
✅ Text analysis in left panel
✅ All visualizations in right panel (stacked)
✅ Uniform styling with existing TerraBotPage
✅ Global visualizer functionality preserved
✅ Error handling for failed uploads
✅ Loading states and animations
✅ Toast notifications for success/error

## Notes

- Satellite backend must be running on port 8000
- Analysis can take 1-3 minutes depending on image size
- Only PNG and JPEG formats are supported
- Location name is required for context
- Results include vegetation, urban, and water change metrics
- LLM provides detailed explanations and recommendations

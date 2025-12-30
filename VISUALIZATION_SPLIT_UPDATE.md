# Visualization Split Update - Individual Images

## Changes Made

### 1. Backend - Split Visualizations
**File:** `satellite-backend/visualization.py`

- Modified `create_change_visualization()` to generate **11 individual images** instead of 1 combined image
- Each visualization is saved separately in a `visualizations/` subdirectory
- Images are numbered and named descriptively:
  1. `01_rgb_before.png` - RGB composite before
  2. `02_rgb_after.png` - RGB composite after
  3. `03_false_color_before.png` - False color (NIR/Red/Green) before
  4. `04_false_color_after.png` - False color after
  5. `05_change_detection.png` - Overall change detection map
  6. `06_vegetation_changes.png` - Vegetation change classification
  7. `07_urban_changes.png` - Urban change classification
  8. `08_change_overlay.png` - Change overlay on after image
  9. `09_ndvi_before.png` - NDVI index before
  10. `10_ndvi_after.png` - NDVI index after
  11. `11_ndvi_change.png` - NDVI change (difference)

- Still creates combined visualization for backward compatibility
- Each individual image is larger and clearer (10x8 inches at 150 DPI)

### 2. Backend API - New Endpoints
**File:** `satellite-backend/main.py`

Added two new endpoints:

**GET `/api/results/{analysis_id}/visualizations`**
- Returns list of all individual visualization filenames
- Response:
  ```json
  {
    "analysis_id": "abc123",
    "result_folder": "Location_20231230_123456",
    "visualizations": ["01_rgb_before.png", "02_rgb_after.png", ...],
    "count": 11
  }
  ```

**GET `/api/results/{analysis_id}/visualizations/{filename}`**
- Returns a specific visualization image
- Example: `/api/results/abc123/visualizations/01_rgb_before.png`

### 3. Server Routes - Proxy Endpoints
**File:** `server/routes/satellite.routes.js`

Added proxy routes for the new endpoints:
- `GET /api/satellite/results/:analysis_id/visualizations` - Get list
- `GET /api/satellite/results/:analysis_id/visualizations/:filename` - Get image

### 4. Frontend - Updated Display Logic
**File:** `client/src/pages/TerraBotPage.jsx`

**Changes:**
1. **Removed "Unknown" from top** - Conditional rendering now checks for satellite images
2. **Moved metrics to LEFT chat panel** - Metrics tables now appear in the bot message
3. **Individual visualizations in RIGHT panel** - Each of the 11 images displayed separately, stacked vertically

**handleSatelliteAnalysis() updates:**
- Fetches list of individual visualizations after analysis
- Creates URLs for all 11 images
- Includes metrics in the chat message content:
  - 🌳 Vegetation Changes (increase/decrease/NDVI)
  - 🏗️ Urban Development (urbanization/construction/NDBI)
  - 💧 Water Bodies (increase/decrease/net change)
- Followed by LLM explanations

**Right panel updates:**
- Removed `SatelliteResults` component (metrics now in chat)
- Displays individual images with animation
- Shows count in header: "Change Detection Visualizations (11)"
- Each image in its own card with fade-in animation

## New Layout

### LEFT PANEL (Chat)
```
👤 User: 🛰️ Analyzing satellite images for Dubai

🤖 TerraBot:
## 🛰️ Satellite Analysis Complete for Dubai

### 📊 Analysis Metrics

**🌳 Vegetation Changes:**
- Increase: +2.45%
- Decrease: -1.23%
- NDVI Change: +0.0234

**🏗️ Urban Development:**
- Urbanization: 3.67%
- Construction Area: 12.45 km²
- NDBI Change: +0.0456

**💧 Water Bodies:**
- Increase: +0.89%
- Decrease: -0.34%
- Net Change: +2.34 km²

### Executive Summary
[LLM generated text...]

### Detailed Analysis
[LLM generated text...]

### Environmental Impact
[LLM generated text...]

### Recommendations
[LLM generated text...]

### Key Insights
[LLM generated text...]
```

### RIGHT PANEL (Visualizations)
```
📊 Change Detection Visualizations (11)

┌─────────────────────────────────┐
│ Before (RGB)                    │
│ [Large clear image]             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ After (RGB)                     │
│ [Large clear image]             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Before (False Color)            │
│ [Large clear image]             │
└─────────────────────────────────┘

... (8 more visualizations)

┌─────────────────────────────────┐
│ NDVI Change                     │
│ [Large clear image with colorbar]│
└─────────────────────────────────┘
```

## Benefits

### 1. Better Readability
- Each visualization is larger and clearer
- No squinting to see details
- Full resolution for each image

### 2. Better Organization
- Metrics in chat (text with text)
- Visualizations in right panel (images with images)
- Logical separation of content types

### 3. Better User Experience
- Scroll through visualizations one by one
- Each image has its own title
- Easier to focus on specific analyses
- Can screenshot individual visualizations

### 4. Better Performance
- Images load progressively
- Can implement lazy loading if needed
- Smaller individual file sizes

## Testing Steps

### 1. Restart Satellite Backend
```bash
cd TerraTrack/TerraTrack_BitNBuild/satellite-backend
python main.py
```

### 2. Restart Server (if needed)
```bash
cd TerraTrack/TerraTrack_BitNBuild/server
npm run dev
```

### 3. Refresh Frontend
- Just refresh browser (Ctrl+R)
- No need to restart client

### 4. Test Analysis
1. Go to TerraBotPage
2. Click "🛰️ Satellite Images"
3. Upload before/after images
4. Click "🚀 Analyze Changes"
5. Wait for analysis

### 5. Verify Results

**LEFT PANEL should show:**
- ✅ User message with location
- ✅ Bot message with:
  - Metrics tables (vegetation, urban, water)
  - Executive summary
  - Detailed analysis
  - Environmental impact
  - Recommendations
  - Key insights

**RIGHT PANEL should show:**
- ✅ Header: "Change Detection Visualizations (11)"
- ✅ 11 individual images stacked vertically:
  1. RGB Before
  2. RGB After
  3. False Color Before
  4. False Color After
  5. Change Detection
  6. Vegetation Changes
  7. Urban Changes
  8. Change Overlay
  9. NDVI Before
  10. NDVI After
  11. NDVI Change
- ✅ Each image in its own card
- ✅ Smooth fade-in animations
- ✅ No "Unknown" text at top

## File Structure

```
results/
└── Location_20231230_123456/
    ├── change_analysis.png          (combined - backward compatibility)
    ├── analysis_report.json
    ├── report.txt
    ├── llm_report.txt
    └── visualizations/               (NEW)
        ├── 01_rgb_before.png
        ├── 02_rgb_after.png
        ├── 03_false_color_before.png
        ├── 04_false_color_after.png
        ├── 05_change_detection.png
        ├── 06_vegetation_changes.png
        ├── 07_urban_changes.png
        ├── 08_change_overlay.png
        ├── 09_ndvi_before.png
        ├── 10_ndvi_after.png
        └── 11_ndvi_change.png
```

## API Endpoints

### Satellite Backend (port 8000)
- `POST /api/analyze` - Analyze images
- `GET /api/results/{id}` - Get results
- `GET /api/results/{id}/image` - Get combined image
- `GET /api/results/{id}/visualizations` - **NEW** Get list of individual images
- `GET /api/results/{id}/visualizations/{filename}` - **NEW** Get specific image

### Server (port 8080)
- `POST /api/satellite/analyze` - Proxy to analyze
- `GET /api/satellite/results/:id` - Proxy to get results
- `GET /api/satellite/results/:id/image` - Proxy to get combined image
- `GET /api/satellite/results/:id/visualizations` - **NEW** Proxy to get list
- `GET /api/satellite/results/:id/visualizations/:filename` - **NEW** Proxy to get image

## Troubleshooting

### Issue: Only seeing 1 image instead of 11
**Solution:** Make sure satellite backend was restarted after the visualization.py changes

### Issue: Images not loading
**Solution:** 
- Check browser console for 404 errors
- Verify visualizations directory exists in results folder
- Check satellite backend logs for errors

### Issue: Metrics not showing in chat
**Solution:**
- Check browser console for errors
- Verify response.data.data structure in handleSatelliteAnalysis
- Check that metrics are being included in messageContent

### Issue: "Unknown" still showing
**Solution:**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check conditional rendering logic

## Summary

✅ **Backend:** Generates 11 individual visualization images
✅ **API:** New endpoints to list and serve individual images
✅ **Server:** Proxy routes for new endpoints
✅ **Frontend:** Metrics in chat, visualizations in right panel
✅ **UX:** Clearer, better organized, more readable
✅ **Performance:** Progressive loading, smaller files

The satellite analysis now provides a much better user experience with clear separation of text (metrics + explanations in chat) and visuals (11 individual images in right panel).

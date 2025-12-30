# Quick Setup Guide - Satellite Integration

## Installation Steps

### 1. Install Server Dependencies
```bash
cd TerraTrack/TerraTrack_BitNBuild/server
npm install
```

This will install the new dependencies:
- `axios` - For HTTP requests to satellite backend
- `form-data` - For multipart form data handling

### 2. Configure Environment Variables

Add to `TerraTrack/TerraTrack_BitNBuild/server/.env`:
```env
SATELLITE_API_URL=http://localhost:8000
```

### 3. Start All Services

#### Terminal 1 - Satellite Backend
```bash
cd TerraTrack/TerraTrack_BitNBuild/satellite-backend
python main.py
```
✅ Should start on http://localhost:8000

#### Terminal 2 - Server
```bash
cd TerraTrack/TerraTrack_BitNBuild/server
npm run dev
```
✅ Should start on http://localhost:8080

#### Terminal 3 - Client
```bash
cd TerraTrack/TerraTrack_BitNBuild/client
npm run dev
```
✅ Should start on http://localhost:5173

## Testing the Integration

1. Open browser to http://localhost:5173
2. Navigate to TerraBotPage
3. Click "🛰️ Satellite Images" button
4. Fill in the form:
   - Location: "Dubai" (or any location name)
   - Before Image: Upload a PNG/JPEG satellite image
   - After Image: Upload a PNG/JPEG satellite image
5. Click "🚀 Analyze Changes"
6. Wait for analysis (1-3 minutes)
7. Verify results:
   - ✅ LLM text appears in left chat panel
   - ✅ Metrics cards appear in right panel
   - ✅ Visualization images appear below metrics

## Troubleshooting

### Issue: "Satellite analysis backend not available"
**Solution**: Make sure satellite backend is running on port 8000
```bash
cd TerraTrack/TerraTrack_BitNBuild/satellite-backend
python main.py
```

### Issue: "Module not found: axios or form-data"
**Solution**: Install server dependencies
```bash
cd TerraTrack/TerraTrack_BitNBuild/server
npm install
```

### Issue: Images not uploading
**Solution**: 
- Check file format (only PNG/JPEG supported)
- Check file size (should be reasonable, < 10MB)
- Check browser console for errors

### Issue: Analysis takes too long
**Solution**: 
- This is normal for large images (can take 1-3 minutes)
- Check satellite backend logs for progress
- Ensure model files are properly loaded

## API Endpoints

### Server (http://localhost:8080)
- `POST /api/satellite/analyze` - Upload and analyze images
- `GET /api/satellite/results/:id` - Get analysis results
- `GET /api/satellite/results/:id/image` - Get visualization image
- `GET /api/satellite/health` - Check satellite backend status

### Satellite Backend (http://localhost:8000)
- `POST /api/analyze` - Process satellite images
- `GET /api/results/:id` - Get results
- `GET /api/results/:id/image` - Get visualization
- `GET /health` - Health check

## Features

✅ **Dual-Mode Interface**: Switch between Chat and Satellite modes
✅ **Image Upload**: PNG/JPEG support with validation
✅ **Real-time Analysis**: Progress indicators and loading states
✅ **Comprehensive Results**: Metrics, visualizations, and LLM explanations
✅ **Error Handling**: User-friendly error messages
✅ **Responsive Design**: Works on all screen sizes
✅ **Theme Consistency**: Matches existing TerraBotPage design

## Next Steps

1. Test with real satellite images
2. Verify all metrics are displaying correctly
3. Check LLM explanations are appearing in chat
4. Ensure visualizations are stacked properly in right panel
5. Test error scenarios (invalid files, backend down, etc.)

## Support

If you encounter any issues:
1. Check all three services are running
2. Check browser console for errors
3. Check server logs for API errors
4. Check satellite backend logs for processing errors
5. Verify environment variables are set correctly

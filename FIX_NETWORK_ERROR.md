# Fix for Network Error - Satellite Analysis

## Problem
Getting "Network Error" when uploading satellite images for analysis.

## Root Cause
The client `.env` file had `VITE_API_URL=http://localhost:5000` but the server is running on port `8080`.

## Solution Applied

### 1. Updated Client Environment Variable
Changed `TerraTrack/TerraTrack_BitNBuild/client/.env`:
```env
VITE_API_URL=http://localhost:8080
```

### 2. Added Satellite Backend URL to Server
Added to `TerraTrack/TerraTrack_BitNBuild/server/.env`:
```env
SATELLITE_API_URL=http://localhost:8000
```

## Steps to Fix

### 1. Stop the Client
Press `Ctrl+C` in the terminal running the client

### 2. Restart the Client
```bash
cd TerraTrack/TerraTrack_BitNBuild/client
npm run dev
```

### 3. Clear Browser Cache (Optional but Recommended)
- Press `Ctrl+Shift+R` (hard refresh)
- Or open DevTools (F12) → Network tab → Check "Disable cache"

### 4. Test Again
1. Navigate to TerraBotPage
2. Click "🛰️ Satellite Images"
3. Upload before/after images
4. Click "🚀 Analyze Changes"

## Verification Checklist

✅ Satellite backend running on http://localhost:8000
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","model_loaded":true,...}
```

✅ Server running on http://localhost:8080
```bash
curl http://localhost:8080/api/satellite/health
# Should return: {"status":"connected","satellite_backend":{...}}
```

✅ Client running on http://localhost:5173
```bash
# Check browser console - no CORS or network errors
```

✅ Environment variables set correctly
- Client: `VITE_API_URL=http://localhost:8080`
- Server: `SATELLITE_API_URL=http://localhost:8000`

## Common Issues

### Issue: Still getting network error after restart
**Solution**: 
1. Check browser console (F12) for actual error
2. Verify all three services are running
3. Try hard refresh (Ctrl+Shift+R)
4. Check server logs for errors

### Issue: CORS error
**Solution**: Server already has CORS configured for `http://localhost:5173`
- Verify client is running on port 5173
- Check server logs for CORS errors

### Issue: Timeout error
**Solution**: 
- Satellite analysis can take 1-3 minutes
- Check satellite backend logs for processing status
- Ensure model files are loaded (check health endpoint)

### Issue: 404 Not Found
**Solution**:
- Verify server has satellite routes imported
- Check `server/index.js` has: `app.use("/api/satellite", satelliteRouter);`
- Restart server after changes

## Testing the Fix

### Quick Test
```bash
# Test from command line (PowerShell)
$body = @{
    location = "Test Location"
}

# This should return 400 (missing images) but proves endpoint is reachable
Invoke-WebRequest -Uri "http://localhost:8080/api/satellite/analyze" -Method POST -Body $body
```

### Full Test
1. Open http://localhost:5173
2. Go to TerraBotPage
3. Switch to Satellite mode
4. Upload test images
5. Submit for analysis
6. Check browser console for network requests
7. Verify request goes to `http://localhost:8080/api/satellite/analyze`

## Expected Behavior

### During Upload
- Loading spinner appears
- "Analyzing..." message in chat
- Right panel shows loading state

### After Analysis (1-3 minutes)
- LLM explanations appear in left chat panel
- Metrics cards appear in right panel:
  - 🌳 Vegetation Changes
  - 🏗️ Urban Development
  - 💧 Water Bodies
- Visualization images appear below metrics
- Success toast notification

## Debug Commands

### Check if services are running
```bash
# Satellite backend
curl http://localhost:8000/health

# Server
curl http://localhost:8080/api/satellite/health

# Client (open in browser)
http://localhost:5173
```

### Check server logs
Look for:
- "Server is running on PORT 8080"
- No errors when accessing /api/satellite routes

### Check satellite backend logs
Look for:
- "Model loaded successfully"
- "Gemini API configured"
- Processing messages when analyzing

## Next Steps

1. **Restart client** (most important!)
2. Clear browser cache
3. Test satellite analysis
4. Check browser console for any errors
5. If still issues, check server and satellite backend logs

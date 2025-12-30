# Gemini 503 Error Fix - API Overload Handling

## Problem
Getting "503 UNAVAILABLE - The model is overloaded" errors when generating LLM explanations for satellite analysis.

## Root Cause
Google's Gemini API is experiencing high demand and temporarily rejecting requests with 503 errors. This is a server-side issue, not a problem with your code or API key.

## Solution Applied

### 1. Retry Logic with Exponential Backoff
Added automatic retry mechanism that:
- Attempts up to 3 times
- Waits 2s, 4s, 8s between retries (exponential backoff)
- Only retries on 503/overload errors
- Gives Gemini time to recover

### 2. Graceful Fallback Response
If all retries fail, provides a structured fallback response that:
- Acknowledges the analysis completed successfully
- Directs users to the quantitative metrics
- Provides generic but useful recommendations
- Maintains the same response structure

### 3. Better Error Handling
- Distinguishes between retryable (503) and non-retryable errors
- Logs each attempt for debugging
- Provides clear user feedback

## What You'll See Now

### Scenario 1: Gemini API Works (Normal)
```
🤖 Generating LLM explanation...
  Calling Gemini API (attempt 1/3)...
  ✓ Gemini response received
```
**Result:** Full AI-generated explanations with detailed analysis

### Scenario 2: Gemini Overloaded but Recovers
```
🤖 Generating LLM explanation...
  Calling Gemini API (attempt 1/3)...
  ⚠️  Attempt 1 failed: 503 UNAVAILABLE
  ⏳ Waiting 2s before retry...
  Calling Gemini API (attempt 2/3)...
  ✓ Gemini response received
```
**Result:** Full AI-generated explanations (after retry)

### Scenario 3: Gemini Completely Overloaded
```
🤖 Generating LLM explanation...
  Calling Gemini API (attempt 1/3)...
  ⚠️  Attempt 1 failed: 503 UNAVAILABLE
  ⏳ Waiting 2s before retry...
  Calling Gemini API (attempt 2/3)...
  ⚠️  Attempt 2 failed: 503 UNAVAILABLE
  ⏳ Waiting 4s before retry...
  Calling Gemini API (attempt 3/3)...
  ⚠️  Attempt 3 failed: 503 UNAVAILABLE
  ❌ All retries exhausted, using fallback response
```
**Result:** Fallback response with generic but useful content

## Fallback Response Structure

When Gemini is unavailable, users will see:

### Executive Summary
"The satellite analysis has been completed successfully. Due to high API demand, detailed AI-generated explanations are temporarily unavailable. Please refer to the quantitative metrics displayed in the visualization for specific change measurements."

### Detailed Analysis
Directs users to the metrics cards and visualization images for specific data.

### Environmental Impact
Reminds users to review the quantitative measurements.

### Recommendations
- Review the quantitative metrics in the visualization
- Compare the before and after RGB images
- Analyze the change detection maps for spatial patterns
- Consider the time period between images
- Use the numerical data for further analysis

### Key Insights
- Quantitative analysis completed successfully
- All indices (NDVI, NDBI, NDWI) calculated
- Change detection maps generated
- Refer to metrics cards for specific measurements

## Important Notes

### The Analysis Still Works!
Even without LLM explanations, you still get:
- ✅ All quantitative metrics (vegetation, urban, water)
- ✅ NDVI, NDBI, NDWI calculations
- ✅ Change detection maps
- ✅ Comprehensive visualization images
- ✅ Percentage changes and area measurements

### LLM is Optional
The LLM explanations are a "nice to have" feature that adds context, but the core satellite analysis is independent and always works.

## Alternatives to Gemini

If Gemini continues to have issues, you can:

### Option 1: Wait and Retry Later
The 503 errors are usually temporary. Try again in:
- 5-10 minutes for short outages
- 1-2 hours for high demand periods
- Check status: https://status.cloud.google.com/

### Option 2: Use a Different Gemini Model
Edit `satellite-backend/llm_explainer.py`:
```python
# Try a different model
explainer = LLMExplainer(model='gemini-1.5-flash')  # Instead of gemini-2.5-flash-lite
```

Available models:
- `gemini-1.5-flash` (faster, more stable)
- `gemini-1.5-pro` (more capable, slower)
- `gemini-2.0-flash-exp` (experimental)

### Option 3: Increase Retry Attempts
Edit `satellite-backend/llm_explainer.py`:
```python
max_retries = 5  # Instead of 3
base_delay = 3   # Instead of 2 (longer waits)
```

### Option 4: Use OpenAI Instead
If you have an OpenAI API key, you can modify the code to use GPT-4 instead:
1. Install: `pip install openai`
2. Modify `llm_explainer.py` to use OpenAI client
3. Set `OPENAI_API_KEY` environment variable

### Option 5: Disable LLM Temporarily
If you just need the metrics and don't care about text explanations:

Edit `satellite-backend/predict.py`:
```python
# Comment out LLM initialization
# self.llm_explainer = LLMExplainer(model='gemini-2.5-flash-lite')
self.llm_explainer = None  # Disable LLM
```

## Testing the Fix

### 1. Restart Satellite Backend
```bash
cd TerraTrack/TerraTrack_BitNBuild/satellite-backend
python main.py
```

### 2. Upload and Analyze
- Go to TerraBotPage
- Upload satellite images
- Click "Analyze Changes"
- Watch the backend logs

### 3. Check Results
**If Gemini works:**
- Detailed AI explanations in left panel
- Specific insights about your location

**If Gemini fails:**
- Generic but useful fallback text
- All metrics and visualizations still work
- No error messages to user

## Monitoring

### Backend Logs
Watch for these messages:
```
✓ Gemini response received          → Success
⏳ Waiting Xs before retry...        → Retrying
❌ All retries exhausted             → Using fallback
```

### User Experience
- No visible errors in the UI
- Text always appears (either AI or fallback)
- Metrics and visualizations always work
- Smooth experience regardless of API status

## When to Contact Support

### Gemini API Issues (Google)
- Persistent 503 errors for > 24 hours
- Check: https://status.cloud.google.com/
- Report: https://support.google.com/

### Your API Key Issues
- 401 Unauthorized → Check API key
- 403 Forbidden → Check API key permissions
- 429 Rate Limit → You're making too many requests

### Code Issues
- Python errors in backend logs
- Missing dependencies
- Configuration problems

## Summary

✅ **Fixed:** Added retry logic with exponential backoff
✅ **Fixed:** Graceful fallback when API unavailable
✅ **Fixed:** Better error handling and logging
✅ **Result:** Analysis always completes successfully
✅ **Result:** Users always get useful information
✅ **Result:** No breaking errors in UI

The satellite analysis will now work reliably even when Gemini is overloaded. Users will either get full AI explanations or a helpful fallback message, but the core functionality (metrics, visualizations) always works.

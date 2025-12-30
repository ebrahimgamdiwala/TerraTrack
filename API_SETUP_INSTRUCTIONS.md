# API Setup Instructions

## OpenWeather API (Weather & Air Quality Data)

### Current Status
⚠️ **The current API key is invalid or expired** - You need to get a free API key.

### How to Get a Free API Key

1. **Sign Up for OpenWeather**
   - Visit: https://openweathermap.org/api
   - Click "Sign Up" in the top right
   - Create a free account (no credit card required)

2. **Get Your API Key**
   - After signing in, go to: https://home.openweathermap.org/api_keys
   - Copy your default API key (or create a new one)
   - **Important**: New API keys take 1-2 hours to activate

3. **Update Your `.env` File**
   - Open `client/.env`
   - Replace the value of `VITE_OPENWEATHER_API_KEY` with your new key:
   ```
   VITE_OPENWEATHER_API_KEY=your_new_api_key_here
   ```

4. **Restart Development Server**
   - Stop the client server (Ctrl+C in the terminal)
   - Run `npm run dev` again
   - Wait 1-2 hours if the key was just created

### Free Tier Limits
- ✅ 1,000 API calls per day
- ✅ 60 calls per minute
- ✅ Access to current weather, forecasts, and air pollution data
- ✅ No credit card required

### APIs Used in This Project
- Current Weather Data
- Air Pollution Data
- 5 Day / 3 Hour Forecast
- Air Pollution Forecast

---

## Our World in Data (Emissions Data)

### Current Status
✅ **Fixed** - Now using the GitHub repository API (no API key needed)

### Details
- **Source**: https://github.com/owid/co2-data
- **Data**: CO2 emissions, GHG, per capita, growth rates, etc.
- **No authentication required**
- **Updated regularly**

---

## News API (Environmental News)

### Current Status
✅ **Working** - Using key: `47eb522f37e64030bdcd12672b1c21bd`

### Free Tier Limits
- 100 requests per day
- Developer plan (may have limitations)

### If You Need a New Key
1. Visit: https://newsapi.org/
2. Sign up for a free account
3. Get your API key
4. Update `VITE_NEWS_API_KEY` in `client/.env`

---

## Quick Fix Summary

**To fix all errors right now:**

1. Get a new OpenWeather API key (takes 5 minutes + 1-2 hour activation)
2. Update `client/.env`:
   ```
   VITE_OPENWEATHER_API_KEY=your_new_key_here
   ```
3. Restart the client server
4. Wait for key activation (1-2 hours)

**Temporary Fallback:**
- The app will show mock weather data until you get a valid API key
- Emissions data is now working (no action needed)
- News API is working (no action needed)

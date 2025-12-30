# 🌍 TerraTrack - Environmental Impact Platform

TerraTrack is a cutting-edge environmental monitoring and AR visualization platform that combines real-time environmental data tracking, immersive 3D plant experiences, AI-powered satellite analysis, interactive 3D globe visualization, and comprehensive campaign management for environmental conservation efforts.

# Demo Video



## ✨ Key Features

### 🎯 *Environmental Tracking & Analytics*
- **Interactive Dashboard**: Real-time environmental metrics with NDVI, NDWI, and custom analysis types.
- **Google Maps Integration**: Point-and-click environmental analysis with reverse geocoding
- **AI Location Analysis**: Gemini-powered environmental insights for any location
- **Environmental News Feed**: Curated news from multiple sources (NewsAPI, GNews, NewsData, Currents API) with India priority
- **Campaign Management**: Create, track, and manage environmental conservation campaigns
- **Donation System**: Integrated Stripe payment system + Web3/MetaMask blockchain donations
- **Advanced Analytics**: Charts and reports for environmental impact tracking

### 🌐 *3D Globe Visualization*
- **Interactive Globe**: Real-time 3D Earth visualization using react-globe.gl
- **Multiple Data Layers**: Air Quality, Forest Loss Hotspots, and Solar Radiation data
- **Air Quality Monitoring**: Live PM2.5, PM10, NO2, and O3 data from Open-Meteo API
- **Forest Loss Tracking**: Curated deforestation hotspots with focus on India (Western Ghats, Northeast, Central regions)
- **Solar Radiation Data**: Global solar irradiance visualization from satellite data
- **Visualization Modes**: Hex bins, points, bars, rings, and heatmap displays
- **Location Insights**: Click any data point for detailed historical analysis
- **Day/Night Cycle**: Optional real-time day/night rendering

### 🛰️ *Satellite Change Detection*
- **AI-Powered Analysis**: Deep learning model for satellite image change detection
- **Environmental Indices**: NDVI (vegetation), NDBI (urban), NDWI (water) analysis
- **LLM Explanations**: Google Gemini generates natural language reports from analysis
- **Multi-band Support**: 13-band Sentinel-2 satellite imagery processing
- **Vegetation Tracking**: Detect vegetation increase/decrease with NDVI change metrics
- **Urban Development Detection**: Construction and demolition area analysis
- **Water Body Analysis**: Track water level changes and quality indicators

### 🌱 *AR Plant Experience*
- **Camera-based AR**: Place virtual plants in real environments using device camera
- **5 High-quality 3D Models**: Aglaonema, House Palm, Snake Plant, Majesty Palm, Ficus Bonsai
- **Environmental Benefits**: Each plant displays CO₂ removal capabilities (4-9 kg/year)
- **GLTF Model Loading**: Optimized 3D models with realistic materials
- **Cross-device Compatibility**: Optimized for both desktop and mobile devices
- **Performance Adaptive**: Automatically adjusts quality based on device capabilities

### 🤖 *AI-Powered Features*
- **TerraBot Chat**: Advanced AI assistant using Google Gemini 2.5 Flash
- **Web Scraping Integration**: Real-time environmental data gathering
- **Source Citations**: Proper attribution for all referenced data
- **Data Visualization**: Auto-generated charts (line, bar, doughnut, scatter)
- **Conversation Memory**: Context-aware follow-up responses
- **Satellite Image Analysis**: Upload and analyze satellite imagery with AI explanations

### ⚠️ *Environmental Alerts*
- **Location-based Alerts**: Real-time environmental alerts for user's location
- **Multi-category Monitoring**: Air quality, water, storms, heat, ecosystem, emissions
- **Severity Classification**: High and medium priority alert categorization
- **Nearby Campaign Suggestions**: AI-powered campaign recommendations based on location
- **OpenWeather Integration**: Live weather and environmental condition data

## 🛠 Tech Stack

### *Frontend*
- **Framework**: React 19+ with functional components and hooks
- **Build Tool**: Vite (ultra-fast build system with HMR)
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router DOM for SPA navigation
- **State Management**: React Context API + custom hooks
- **Icons**: Lucide React (modern icon library)
- **Animations**: Framer Motion for smooth transitions
- **Notifications**: React Hot Toast

### *3D Graphics & AR*
- **3D Engine**: Three.js (WebGL-based 3D graphics)
- **React Integration**: @react-three/fiber (React renderer for Three.js)
- **3D Utilities**: @react-three/drei (helpers and abstractions)
- **Globe Visualization**: react-globe.gl for 3D Earth rendering
- **Model Loading**: GLTF/GLB model support with fallbacks
- **AR Technology**: Camera-based AR using getUserMedia API
- **Performance**: Adaptive quality and device-specific optimizations

### *AI & Machine Learning*
- **Chat AI**: Google Gemini 2.5 Flash for TerraBot conversations
- **Satellite Analysis**: PyTorch deep learning model for change detection
- **LLM Explanations**: Gemini-powered natural language report generation
- **Environmental Indices**: NDVI, NDBI, NDWI calculations

### *Backend & Database*
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with refresh token system
- **File Upload**: Multer with Cloudinary integration
- **Email Service**: Nodemailer for transactional emails
- **Satellite Backend**: FastAPI (Python) for image analysis

### *Integrations & APIs*
- **Maps**: Google Maps API for interactive mapping
- **AI**: Google Gemini API for chat and analysis
- **Payments**: Stripe API for donation processing
- **Blockchain**: MetaMask/ethers.js for Web3 donations (Sepolia testnet)
- **Air Quality**: Open-Meteo Air Quality API
- **Solar Data**: Open-Meteo Satellite Radiation Archive API
- **News**: Multi-source aggregation (NewsAPI, GNews, NewsData, Currents)
- **Charts**: Chart.js with React wrapper for data visualization
- **Geocoding**: Nominatim API for reverse geocoding

### *Development Tools*
- **Package Manager**: npm
- **Code Quality**: ESLint with custom configuration
- **Version Control**: Git
- **Development**: Hot Module Replacement (HMR)
- **Build**: Optimized production builds with code splitting
- **Python Environment**: FastAPI, PyTorch, rasterio for satellite processing

## 🚀 Getting Started

### *Prerequisites*
- Node.js (v18 or higher)
- npm or yarn package manager
- MongoDB database (local or cloud)
- Python 3.9+ (for satellite backend)
- Git for version control

**Important**: This repo contains frontend, backend, and satellite-backend services in `client/`, `server/`, and `satellite-backend/` respectively.

### *Installation*

1. **Clone the repository**
   ```bash
   git clone https://github.com/ebrahimgamdiwala/TerraTrack.git
   cd TerraTrack
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Install Satellite Backend Dependencies** (Optional - for satellite analysis)
   ```bash
   cd ../satellite-backend
   pip install -r requirements.txt
   ```

5. **Environment Configuration**
   
   Create `.env` files in client, server, and satellite-backend directories:
   
   **Client (.env):**
   ```env
   # API URLs
   VITE_API_URL=http://localhost:5000
   VITE_SATELLITE_API_URL=http://localhost:8000

   # Google Maps JavaScript API Key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Stripe publishable key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

   # Google Gemini API Key (for TerraBot)
   VITE_GEMINI_API_KEY=your_gemini_api_key

   # OpenWeather API Key (for alerts)
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key

   # News API Keys (optional - multiple sources)
   VITE_NEWS_API_KEY=your_newsapi_key
   VITE_GNEWS_API_KEY=your_gnews_key
   VITE_NEWSDATA_API_KEY=your_newsdata_key
   VITE_CURRENTS_API_KEY=your_currents_key
   ```
   
   
   **Server (.env):**
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_ACCESS_SECRET=your_jwt_access_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_email_password
   ```

   **Satellite Backend (.env):** (Optional)
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

   **Notes about keys:**
   - Keep production keys out of version control. Use a secrets manager or CI/CD secrets.
   - For Google Maps, ensure billing is enabled and Maps JavaScript API is enabled.
   - For Web3 donations, the app uses Sepolia testnet by default.


### *Running the Application*

1. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Backend will run on http://localhost:5000

2. **Start the Frontend** (in a new terminal)
   ```bash
   cd client  
   npm run dev
   ```
   Frontend will run on http://localhost:5173

3. **Start Satellite Backend** (optional, in a new terminal)
   ```bash
   cd satellite-backend
   python main.py
   ```
   Satellite API will run on http://localhost:8000

4. **Access the Application**
   Open your browser and navigate to http://localhost:5173

**Troubleshooting:**
- Invalid Google Maps key: Check for "InvalidKeyMapError" in console. Verify API is enabled and referrers are configured.
- If `window.google` is undefined, ensure Maps script loads before accessing `google.maps`.
- Restart dev servers after changing `.env` files.
- Use Stripe test keys only for local development.
- For Web3 features, ensure MetaMask is connected to Sepolia testnet.

## 📱 Features Overview

### *Dashboard*
- Environmental metrics visualization with NDVI, NDWI analysis
- Interactive Google Maps with point-and-click analysis
- AI-powered location insights using Gemini
- Real-time environmental news feed (India priority + global)
- Campaign progress tracking
- Historical data visualization

### *3D Globe Visualization*
- Interactive 3D Earth with multiple data layers
- Air Quality Data: PM2.5, PM10, NO2, O3 from 50+ global cities
- Forest Loss Hotspots: Deforestation tracking with India focus
- Solar Radiation: Global irradiance data visualization
- Multiple visualization modes (hex, points, bars, rings)
- Location-specific historical data and trends
- Auto-rotate and day/night cycle options

### *Satellite Image Analysis*
- Upload satellite imagery for AI-powered change detection
- Vegetation analysis: NDVI change, increase/decrease percentages
- Urban analysis: Construction area, demolition detection
- Water analysis: Water body change detection
- LLM-generated natural language explanations
- Visual comparison overlays

### *AR Plants Experience*
- Camera-based augmented reality
- 5 high-quality 3D plant models (Aglaonema, House Palm, Snake Plant, Majesty Palm, Ficus Bonsai)
- Environmental impact calculations (CO₂ removal per plant)
- Mobile-optimized performance
- Interactive plant information cards

### *Campaign Management*
- Create environmental campaigns with categories (reforestation, ocean-cleanup, renewable-energy, etc.)
- Track donations and progress with real-time updates
- Share campaign details with images and descriptions
- Multiple payment methods: Stripe + Web3/MetaMask
- Analytics and reporting

### *Environmental Alerts*
- Location-based environmental alerts
- Multi-category alerts: Air, Water, Storm, Heat, Ecosystem, Emissions
- Severity-based prioritization
- Nearby campaign recommendations
- Custom location support

### *TerraBot AI Chat*
- Advanced environmental AI assistant
- Web scraping for real-time data
- Auto-generated data visualizations
- Source citations with reliability scores
- Satellite image upload and analysis
- Conversation history support

---

## 🏗 Project Structure

```
TerraTrack/
├── client/                         # React frontend application
│   ├── public/                     # Static assets
│   │   ├── models/                 # 3D plant models (GLTF)
│   │   │   ├── aglaonema_plant/
│   │   │   ├── ficus_bonsai/
│   │   │   ├── house_palm_plant/
│   │   │   ├── low_poly_snake_plant/
│   │   │   └── majesty_palm_plant/
│   │   └── textures/               # Globe and AR textures
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── AirQuality/         # Globe visualization components
│   │   │   │   ├── GlobeView.jsx   # Main 3D globe component
│   │   │   │   ├── AQILegend.jsx   # Air quality legend
│   │   │   │   ├── LeftSidebar.jsx # Dataset controls
│   │   │   │   ├── RightSidebar.jsx# Location details
│   │   │   │   ├── LocationPanel.jsx
│   │   │   │   └── TimeControls.jsx
│   │   │   ├── ChatMessage.jsx     # TerraBot message display
│   │   │   ├── ChatInput.jsx       # Chat input with file upload
│   │   │   ├── GoogleMapComponent.jsx
│   │   │   ├── SatelliteResults.jsx# Satellite analysis display
│   │   │   ├── SourceCitations.jsx # Citation display
│   │   │   ├── VisualizationDisplay.jsx
│   │   │   └── WalletConnect.jsx   # Web3 wallet connection
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx   # Main dashboard with maps
│   │   │   ├── GlobeVisualizationPage.jsx # 3D globe page
│   │   │   ├── TerraBotPage.jsx    # AI chat interface
│   │   │   ├── ARPlantsPage.jsx    # AR plant experience
│   │   │   ├── AlertsPage.jsx      # Environmental alerts
│   │   │   ├── CampaignsPage.jsx   # Campaign listing
│   │   │   ├── CreateCampaignPage.jsx
│   │   │   ├── CampaignDetailsPage.jsx
│   │   │   ├── DonationHistoryPage.jsx
│   │   │   └── ...                 # Auth pages
│   │   ├── hooks/
│   │   │   ├── useOpenAQData.js    # Air quality data hook
│   │   │   ├── useForestData.js    # Forest loss data hook
│   │   │   └── useSolarRadiationData.js # Solar data hook
│   │   ├── services/
│   │   │   ├── geminiService.js    # Gemini AI integration
│   │   │   ├── blockchainService.js# Web3/MetaMask integration
│   │   │   ├── newsService.js      # Multi-source news aggregation
│   │   │   ├── campaignService.js  # Campaign API calls
│   │   │   └── analysisService.js  # Environmental analysis
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Authentication state
│   │   │   └── Web3Context.jsx     # Blockchain state
│   │   ├── contracts/
│   │   │   └── CrowdFunding.js     # Smart contract ABI
│   │   └── utils/                  # Helper functions
│   ├── package.json
│   └── vite.config.js
│
├── server/                         # Node.js backend application
│   ├── config/
│   │   ├── connectDB.js            # MongoDB connection
│   │   └── sendEmail.js            # Email configuration
│   ├── controllers/
│   │   ├── campaign.controllers.js # Campaign CRUD
│   │   ├── donation.controllers.js # Donation handling
│   │   ├── stripe.controller.js    # Stripe payments
│   │   ├── user.controllers.js     # User management
│   │   └── uploadImage.controller.js
│   ├── models/
│   │   ├── campaign.model.js
│   │   ├── donation.model.js
│   │   └── user.model.js
│   ├── routes/
│   │   ├── campaign.routes.js
│   │   ├── donation.routes.js
│   │   ├── satellite.routes.js     # Satellite analysis proxy
│   │   ├── stripe.routes.js
│   │   └── user.routes.js
│   ├── middlewares/
│   │   ├── auth.js                 # JWT authentication
│   │   └── admin.js                # Admin authorization
│   ├── services/
│   │   └── stripeService.js
│   └── utils/                      # Email templates, tokens
│
├── satellite-backend/              # Python FastAPI for satellite analysis
│   ├── main.py                     # FastAPI application
│   ├── model.py                    # PyTorch change detection model
│   ├── predict.py                  # Prediction pipeline
│   ├── analyzer.py                 # Environmental index calculations
│   ├── llm_explainer.py           # Gemini LLM integration
│   ├── visualization.py           # Analysis visualizations
│   ├── config.py                  # Model configuration
│   ├── train.py                   # Model training script
│   └── requirements.txt
│
└── README.md
```

## 🔧 Available Scripts

### *Frontend (client/)*
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### *Backend (server/)*
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run debug` - Start with debugging enabled

### *Satellite Backend (satellite-backend/)*
- `python main.py` - Start FastAPI server (default port 8000)
- `python train.py` - Train change detection model
- `python predict.py` - Run prediction on satellite images

## 🌐 API Endpoints

### *Node.js Backend (port 5000)*
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `GET /api/campaigns` - List campaigns with filtering
- `POST /api/campaigns` - Create campaign
- `POST /api/donations` - Process donation
- `POST /api/stripe/create-payment-intent` - Stripe payment

### *Satellite Backend (port 8000)*
- `GET /` - API status and endpoints
- `POST /analyze` - Full satellite analysis with AI
- `POST /analyze/indices` - Environmental indices only
- `GET /health` - Health check

## 🌐 Browser Support

- **Desktop**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile**: Chrome Mobile, Safari Mobile, Samsung Internet
- **WebGL**: Required for 3D graphics, globe, and AR features
- **Camera**: Required for AR plant placement feature
- **MetaMask**: Required for Web3 donation features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂ Support

For support, email ebrahimgamdiwala@gmail.com or create an issue in the GitHub repository.

## 🔗 Links

- **Repository**: [https://github.com/ebrahimgamdiwala/TerraTrack](https://github.com/ebrahimgamdiwala/TerraTrack)
- **Live Demo**: [Coming Soon]
- **Documentation**: [Coming Soon]
- **API Docs**: [Coming Soon]

## 📊 Data Sources

- **Air Quality**: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
- **Solar Radiation**: [Open-Meteo Satellite Radiation API](https://open-meteo.com/en/docs/satellite-radiation-api)
- **Forest Data**: Curated deforestation hotspot database
- **News**: NewsAPI, GNews, NewsData, Currents API
- **Geocoding**: OpenStreetMap Nominatim

---

Made with 🌱 for a greener planet by the TerraTrack team

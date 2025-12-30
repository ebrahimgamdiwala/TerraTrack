# Expected Layout After Satellite Analysis

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TERRABOT ANALYSIS                                  │
│  [← Back]  🤖 TerraBot Analysis                        [Clear Chat]         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┬──────────────────────────────────────────┐
│  LEFT PANEL (Chat Interface)     │  RIGHT PANEL (Visualizations)            │
│                                   │                                          │
│  💬 Chat Analysis / 🛰️ Satellite  │  🛰️ Satellite Analysis Metrics          │
│  ┌────────────────────────────┐  │  ┌────────────────────────────────────┐ │
│  │ [Location Input]           │  │  │ 🌳 Vegetation Changes              │ │
│  │ [Before Image Upload]      │  │  │   Increase: +2.45%                 │ │
│  │ [After Image Upload]       │  │  │   Decrease: -1.23%                 │ │
│  │ [🚀 Analyze Changes]       │  │  │   NDVI Change: +0.0234             │ │
│  └────────────────────────────┘  │  └────────────────────────────────────┘ │
│                                   │                                          │
│  👤 User: Analyzing Dubai         │  ┌────────────────────────────────────┐ │
│                                   │  │ 🏗️ Urban Development               │ │
│  🤖 TerraBot:                     │  │   Urbanization: 3.67%              │ │
│  ## Executive Summary             │  │   Construction: 12.45 km²          │ │
│  The analysis reveals...          │  │   NDBI Change: +0.0456             │ │
│                                   │  └────────────────────────────────────┘ │
│  ## Detailed Analysis             │                                          │
│  Vegetation patterns show...      │  ┌────────────────────────────────────┐ │
│                                   │  │ 💧 Water Bodies                    │ │
│  ## Environmental Impact          │  │   Increase: +0.89%                 │ │
│  The changes indicate...          │  │   Decrease: -0.34%                 │ │
│                                   │  │   Net Change: +2.34 km²            │ │
│  ## Recommendations               │  └────────────────────────────────────┘ │
│  Based on the analysis...         │                                          │
│                                   │  📊 Change Detection Visualizations      │
│  ## Key Insights                  │  ┌────────────────────────────────────┐ │
│  • Major urban expansion          │  │                                    │ │
│  • Vegetation loss in...          │  │  [RGB Before] [RGB After]         │ │
│  • Water body changes...          │  │                                    │ │
│                                   │  │  [Change Map] [Veg Map] [Urban]   │ │
│  ┌────────────────────────────┐  │  │                                    │ │
│  │ Type your message...       │  │  │  [NDVI] [NDBI] [NDWI]             │ │
│  │                      [Send]│  │  │                                    │ │
│  └────────────────────────────┘  │  │  Comprehensive visualization       │ │
│                                   │  │  showing all indices and changes   │ │
└──────────────────────────────────┴──┴────────────────────────────────────────┘
```

## Detailed Breakdown

### LEFT PANEL - Chat Interface
**Purpose:** Text-based interaction and LLM explanations

**Content:**
1. **Mode Switcher**
   - 💬 Chat Analysis (default)
   - 🛰️ Satellite Images

2. **Satellite Upload Form** (when in Satellite mode)
   - Location name input
   - Before image upload (PNG/JPEG)
   - After image upload (PNG/JPEG)
   - Analyze button

3. **Chat Messages**
   - User messages (right-aligned, blue)
   - Bot messages (left-aligned, dark)
   - LLM explanations formatted with markdown:
     - Executive Summary
     - Detailed Analysis
     - Environmental Impact
     - Recommendations
     - Key Insights

4. **Chat Input** (at bottom)
   - Text input field
   - Send button
   - Quick prompt suggestions

### RIGHT PANEL - Visualizations & Metrics
**Purpose:** Visual data, charts, and metrics

**Content (when satellite analysis is done):**

1. **Satellite Analysis Metrics** (3 cards)
   - 🌳 **Vegetation Changes**
     - Increase percentage
     - Decrease percentage
     - Mean NDVI change
   
   - 🏗️ **Urban Development**
     - Urbanization percentage
     - Construction area (km²)
     - Mean NDBI change
   
   - 💧 **Water Bodies**
     - Increase percentage
     - Decrease percentage
     - Net change (km²)

2. **Change Detection Visualizations** (large image)
   - Comprehensive 3x3 grid showing:
     - **Row 1:** RGB Before, RGB After, Change Map
     - **Row 2:** Vegetation Change, Urban Change, Water Change
     - **Row 3:** NDVI, NDBI, NDWI indices
   - All graphs in one image, stacked vertically
   - Full width of right panel

3. **AI Analysis Charts** (if from chat queries)
   - Line charts
   - Bar charts
   - Comparison charts
   - Key insights bullets

4. **Data Sources** (at bottom)
   - Links to data sources
   - Citations
   - Timestamps

### RIGHT PANEL - When Coming from Visualizer
**Additional Content (shown above satellite results):**

1. **Location Card**
   - City name
   - Country
   - Latitude/Longitude coordinates

2. **Current Reading Card**
   - PM2.5 / PM10 / NO₂ / O₃ value
   - AQI category (Good/Moderate/Unhealthy)
   - Color-coded border

3. **7-Day Historical Chart**
   - Line chart showing past week
   - Pollutant trends
   - Interactive tooltips

4. **"Ask More" Quick Actions**
   - Pollution source breakdown
   - Seasonal patterns
   - Government policies
   - Future predictions

## Image Visualization Details

The satellite backend generates ONE comprehensive image that contains ALL visualizations:

### Image Layout (3x3 Grid)
```
┌─────────────┬─────────────┬─────────────┐
│ RGB Before  │ RGB After   │ Change Map  │
│ (True Color)│ (True Color)│ (Binary)    │
├─────────────┼─────────────┼─────────────┤
│ Vegetation  │ Urban       │ Water       │
│ Change Map  │ Change Map  │ Change Map  │
├─────────────┼─────────────┼─────────────┤
│ NDVI        │ NDBI        │ NDWI        │
│ (Vegetation)│ (Built-up)  │ (Water)     │
└─────────────┴─────────────┴─────────────┘
```

### Color Coding
- **Change Map:** Red = Changed, Blue = Unchanged
- **Vegetation:** Green = Increase, Red = Decrease, Gray = No Change
- **Urban:** Orange = Construction, Purple = Demolition, Gray = No Change
- **Water:** Blue = Increase, Brown = Decrease, Gray = No Change
- **NDVI:** Green gradient (higher = more vegetation)
- **NDBI:** Red gradient (higher = more built-up)
- **NDWI:** Blue gradient (higher = more water)

## User Flow

### Step 1: Upload Images
1. Click "🛰️ Satellite Images" tab
2. Enter location name (e.g., "Dubai")
3. Upload before image (PNG/JPEG)
4. Upload after image (PNG/JPEG)
5. Click "🚀 Analyze Changes"

### Step 2: Processing (1-3 minutes)
- Loading spinner appears
- "Analyzing..." message in chat
- Progress indicator in right panel

### Step 3: Results Display
**Left Panel:**
- User message: "🛰️ Analyzing satellite images for Dubai"
- Bot message with LLM explanations:
  - Executive Summary (overview)
  - Detailed Analysis (specifics)
  - Environmental Impact (consequences)
  - Recommendations (actions)
  - Key Insights (bullet points)

**Right Panel:**
- Metrics cards appear (vegetation, urban, water)
- Comprehensive visualization image loads
- All 9 graphs visible in one image
- Scrollable if needed

### Step 4: Interaction
- Read LLM explanations in left panel
- View metrics and graphs in right panel
- Ask follow-up questions in chat
- Download or share results

## Responsive Behavior

- **Resizable:** Drag the divider between panels to adjust width
- **Minimum Width:** Right panel minimum 300px, maximum 800px
- **Scroll:** Both panels scroll independently
- **Mobile:** Stacks vertically (chat on top, visualizations below)

## Error States

### No Images Uploaded
- Disabled "Analyze" button
- Placeholder text in upload areas

### Analysis Failed
- Error message in chat
- Toast notification
- Retry button

### Backend Unavailable
- "Satellite backend not available" message
- Link to setup instructions
- Health check status

## Success Indicators

✅ **Analysis Complete:**
- Success toast notification
- LLM text appears in left panel
- Metrics cards appear in right panel
- Visualization image loads
- All data populated

✅ **Image Loaded:**
- No "loading" placeholder
- Full resolution image visible
- All 9 graphs clearly visible
- Proper aspect ratio maintained

✅ **Data Accurate:**
- Metrics match visualization
- Percentages add up correctly
- LLM explanations reference correct data
- Timestamps are current

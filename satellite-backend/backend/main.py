"""
FastAPI Backend for Satellite Change Detection with LLM Integration
Handles image upload, model inference, and LLM-powered analysis
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, List
import os
import sys
import shutil
import uuid
from datetime import datetime
import json
import torch

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from predict import ChangeDetectionPredictor
import config

app = FastAPI(
    title="Satellite Change Detection API",
    description="AI-powered satellite image analysis with LLM explanations",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global predictor instance
predictor = None
UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AnalysisRequest(BaseModel):
    location: Optional[str] = "Unknown"
    date_before: Optional[str] = None
    date_after: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    global predictor
    model_path = os.path.join(config.MODEL_DIR, 'best_model.pth')
    
    if not os.path.exists(model_path):
        print(f"⚠️  Model not found at {model_path}")
        print("API will run in limited mode (indices only)")
        return
    
    print("🚀 Loading AI model...")
    # Set memory optimization
    os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'
    predictor = ChangeDetectionPredictor(model_path)
    print("✅ Model loaded successfully")

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Satellite Change Detection API",
        "version": "2.0.0",
        "features": ["AI Model", "LLM Explanations", "Environmental Indices"],
        "endpoints": {
            "health": "/health",
            "analyze": "/api/analyze",
            "results": "/api/results/{analysis_id}",
            "visualization": "/api/results/{analysis_id}/image"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": predictor is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/analyze")
async def analyze_images(
    before_images: List[UploadFile] = File(...),
    after_images: List[UploadFile] = File(...),
    location: str = "Unknown",
    date_before: Optional[str] = None,
    date_after: Optional[str] = None
):
    """
    Analyze satellite image changes with AI model and LLM
    
    Accepts:
    - 13 .tif files for before and 13 .tif files for after (original format)
    - OR 1 PNG/JPEG for before and 1 PNG/JPEG for after (user-friendly)
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Check if using RGB images (PNG/JPEG) or multi-band (TIF)
    is_rgb_mode = False
    if len(before_images) == 1 and len(after_images) == 1:
        before_ext = os.path.splitext(before_images[0].filename.lower())[1]
        after_ext = os.path.splitext(after_images[0].filename.lower())[1]
        if before_ext in ['.png', '.jpg', '.jpeg'] and after_ext in ['.png', '.jpg', '.jpeg']:
            is_rgb_mode = True
            print("📸 RGB mode detected - will convert to multi-band")
    
    # Validate file count for multi-band mode
    if not is_rgb_mode and (len(before_images) != 13 or len(after_images) != 13):
        raise HTTPException(
            status_code=400,
            detail=f"Expected 13 bands for each image OR 1 RGB image each. Got {len(before_images)} before and {len(after_images)} after"
        )
    
    # Create unique analysis ID
    analysis_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    analysis_dir = os.path.join(UPLOAD_DIR, f"{analysis_id}_{timestamp}")
    
    before_dir = os.path.join(analysis_dir, "before")
    after_dir = os.path.join(analysis_dir, "after")
    os.makedirs(before_dir, exist_ok=True)
    os.makedirs(after_dir, exist_ok=True)
    
    try:
        # Save uploaded files
        print(f"📁 Saving uploaded files for analysis {analysis_id}...")
        
        if is_rgb_mode:
            # Save RGB images and convert
            from image_converter import ImageConverter
            converter = ImageConverter()
            
            # Save original RGB files
            before_rgb_path = os.path.join(analysis_dir, "before_rgb" + os.path.splitext(before_images[0].filename)[1])
            after_rgb_path = os.path.join(analysis_dir, "after_rgb" + os.path.splitext(after_images[0].filename)[1])
            
            with open(before_rgb_path, "wb") as f:
                shutil.copyfileobj(before_images[0].file, f)
            with open(after_rgb_path, "wb") as f:
                shutil.copyfileobj(after_images[0].file, f)
            
            # Convert to multi-band
            print("🔄 Converting RGB to multi-band format...")
            converter.convert_rgb_to_multispectral(before_rgb_path, before_dir)
            converter.convert_rgb_to_multispectral(after_rgb_path, after_dir)
            print("✓ Conversion complete")
        else:
            # Save multi-band TIF files
            for file in before_images:
                file_path = os.path.join(before_dir, file.filename)
                with open(file_path, "wb") as f:
                    shutil.copyfileobj(file.file, f)
            
            for file in after_images:
                file_path = os.path.join(after_dir, file.filename)
                with open(file_path, "wb") as f:
                    shutil.copyfileobj(file.file, f)
        
        print(f"🤖 Running AI analysis...")
        start_time = datetime.now()
        
        # Clear GPU cache before inference
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Run prediction with LLM
        report = predictor.predict(
            before_dir,
            after_dir,
            date_before or "Unknown",
            date_after or "Unknown",
            location
        )
        
        # Clear GPU cache after inference
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Find the generated results
        result_folders = [f for f in os.listdir(config.RESULTS_DIR) 
                         if f.startswith(location) and os.path.isdir(os.path.join(config.RESULTS_DIR, f))]
        result_folder = sorted(result_folders)[-1] if result_folders else None
        
        response = {
            "status": "success",
            "analysis_id": analysis_id,
            "location": location,
            "processing_time": processing_time,
            "mode": "RGB" if is_rgb_mode else "Multi-band",
            "data": report,
            "result_folder": result_folder,
            "has_llm": "llm_explanations" in report,
            "visualization_available": result_folder is not None
        }
        
        # Save response for later retrieval
        response_path = os.path.join(analysis_dir, "response.json")
        with open(response_path, 'w') as f:
            json.dump(response, f, indent=4)
        
        print(f"✅ Analysis complete in {processing_time:.2f}s")
        
        return JSONResponse(content=response)
        
    except Exception as e:
        # Cleanup on error
        if os.path.exists(analysis_dir):
            shutil.rmtree(analysis_dir)
        
        # Clear GPU cache on error
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/results/{analysis_id}")
async def get_results(analysis_id: str):
    """Get analysis results by ID"""
    # Find analysis directory
    analysis_dirs = [d for d in os.listdir(UPLOAD_DIR) if d.startswith(analysis_id)]
    
    if not analysis_dirs:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis_dir = os.path.join(UPLOAD_DIR, analysis_dirs[0])
    response_path = os.path.join(analysis_dir, "response.json")
    
    if not os.path.exists(response_path):
        raise HTTPException(status_code=404, detail="Results not found")
    
    with open(response_path, 'r') as f:
        response = json.load(f)
    
    return JSONResponse(content=response)

@app.get("/api/results/{analysis_id}/image")
async def get_visualization(analysis_id: str):
    """Get visualization image for analysis"""
    # Find analysis directory
    analysis_dirs = [d for d in os.listdir(UPLOAD_DIR) if d.startswith(analysis_id)]
    
    if not analysis_dirs:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis_dir = os.path.join(UPLOAD_DIR, analysis_dirs[0])
    response_path = os.path.join(analysis_dir, "response.json")
    
    with open(response_path, 'r') as f:
        response = json.load(f)
    
    result_folder = response.get('result_folder')
    if not result_folder:
        raise HTTPException(status_code=404, detail="Visualization not found")
    
    image_path = os.path.join(config.RESULTS_DIR, result_folder, "change_analysis.png")
    
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Visualization image not found")
    
    return FileResponse(image_path, media_type="image/png")

@app.get("/api/cities")
async def get_cities():
    """Get list of available test cities"""
    return {
        "train_cities": config.TRAIN_CITIES,
        "test_cities": config.TEST_CITIES
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""Configuration file for the satellite change detection model"""

import os

# Dataset paths
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
DATASET_ROOT = str(BASE_DIR / "dataset")
TRAIN_CITIES = ["aguasclaras", "bercy", "bordeaux", "nantes", "paris", "rennes", 
                "saclay_e", "abudhabi", "cupertino", "pisa", "beihai", "hongkong", 
                "beirut", "mumbai"]
TEST_CITIES = ["brasilia", "montpellier", "norcia", "rio", "saclay_w", "valencia", 
               "dubai", "lasvegas", "milano", "chongqing"]

# Model parameters
IMG_SIZE = 256
BATCH_SIZE = 4
NUM_EPOCHS = 50
LEARNING_RATE = 0.0001
NUM_WORKERS = 4

# Sentinel-2 band information
BAND_NAMES = ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 
              'B08', 'B09', 'B10', 'B11', 'B12', 'B8A']

# Selected bands for different analyses
RGB_BANDS = [3, 2, 1]  # B04, B03, B02 (Red, Green, Blue)
VEGETATION_BANDS = [7, 3, 2]  # B08 (NIR), B04 (Red), B03 (Green)
URBAN_BANDS = [11, 7, 3]  # B12 (SWIR), B08 (NIR), B04 (Red)

# Change detection thresholds
CHANGE_THRESHOLD = 0.5
VEGETATION_THRESHOLD = 0.3
URBAN_THRESHOLD = 0.4

# Output directories
OUTPUT_DIR = "outputs"
MODEL_DIR = "models"
RESULTS_DIR = "results"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

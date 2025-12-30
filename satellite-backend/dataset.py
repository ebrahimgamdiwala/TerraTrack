"""Dataset loader for Onera Satellite Change Detection"""

import os
import numpy as np
import warnings
import rasterio
from rasterio.errors import NotGeoreferencedWarning
import torch
from torch.utils.data import Dataset
import albumentations as A
from albumentations.pytorch import ToTensorV2
import config

# Suppress georeferencing warnings (we don't need GPS coordinates for change detection)
warnings.filterwarnings('ignore', category=NotGeoreferencedWarning)

class OneraDataset(Dataset):
    def __init__(self, cities, root_dir, transform=None, use_rect=True):
        self.cities = cities
        self.root_dir = root_dir
        self.transform = transform
        self.use_rect = use_rect
        self.samples = self._load_samples()
    
    def _load_samples(self):
        samples = []
        for city in self.cities:
            # Try nested folder structure first
            city_path = os.path.join(self.root_dir, 'Onera Satellite Change Detection dataset - Images', city)
            if os.path.exists(city_path):
                samples.append(city)
            else:
                # Try direct path
                city_path = os.path.join(self.root_dir, city)
                if os.path.exists(city_path):
                    samples.append(city)
        return samples
    
    def _load_bands(self, city, time_idx):
        """Load all 13 bands for a given city and time"""
        folder = f"imgs_{time_idx}_rect" if self.use_rect else f"imgs_{time_idx}"
        
        # Try nested folder structure first
        city_path = os.path.join(self.root_dir, 'Onera Satellite Change Detection dataset - Images', city, folder)
        if not os.path.exists(city_path):
            # Try direct path
            city_path = os.path.join(self.root_dir, city, folder)
        
        bands = []
        for band_name in config.BAND_NAMES:
            band_path = os.path.join(city_path, f"{band_name}.tif")
            with rasterio.open(band_path) as src:
                band_data = src.read(1).astype(np.float32)
                # Normalize to 0-1 range
                band_data = np.clip(band_data / 10000.0, 0, 1)
                bands.append(band_data)
        
        return np.stack(bands, axis=0)  # Shape: (13, H, W)
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        city = self.samples[idx]
        
        # Load before and after images
        img1 = self._load_bands(city, 1)
        img2 = self._load_bands(city, 2)
        
        # Apply transformations
        if self.transform:
            # Transpose for albumentations (H, W, C)
            img1_t = np.transpose(img1, (1, 2, 0))
            img2_t = np.transpose(img2, (1, 2, 0))
            
            transformed = self.transform(image=img1_t, image2=img2_t)
            img1 = transformed['image']
            img2 = transformed['image2']
        else:
            img1 = torch.from_numpy(img1)
            img2 = torch.from_numpy(img2)
        
        return {
            'img1': img1,
            'img2': img2,
            'city': city
        }

def get_transforms(train=True):
    if train:
        return A.Compose([
            A.RandomCrop(config.IMG_SIZE, config.IMG_SIZE),
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.5),
            A.RandomRotate90(p=0.5),
            ToTensorV2()
        ], additional_targets={'image2': 'image'})
    else:
        return A.Compose([
            A.CenterCrop(config.IMG_SIZE, config.IMG_SIZE),
            ToTensorV2()
        ], additional_targets={'image2': 'image'})

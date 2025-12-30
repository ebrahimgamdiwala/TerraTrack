"""Change Detection Model with Multi-task Learning"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import segmentation_models_pytorch as smp

class AttentionBlock(nn.Module):
    def __init__(self, in_channels):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, 1, kernel_size=1)
        
    def forward(self, x):
        attention = torch.sigmoid(self.conv(x))
        return x * attention

class ChangeDetectionModel(nn.Module):
    def __init__(self, in_channels=13, encoder_name='resnet34'):
        super().__init__()
        
        # Siamese encoder for both images
        self.encoder = smp.Unet(
            encoder_name=encoder_name,
            encoder_weights=None,
            in_channels=in_channels,
            classes=64,
            activation=None
        )
        
        # Attention mechanism
        self.attention = AttentionBlock(128)
        
        # Change detection head
        self.change_head = nn.Sequential(
            nn.Conv2d(128, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 1, kernel_size=1),
            nn.Sigmoid()
        )
        
        # Vegetation change head
        self.vegetation_head = nn.Sequential(
            nn.Conv2d(128, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 3, kernel_size=1),  # 3 classes: no change, increase, decrease
            nn.Softmax(dim=1)
        )
        
        # Urban change head
        self.urban_head = nn.Sequential(
            nn.Conv2d(128, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 3, kernel_size=1),  # 3 classes: no change, construction, demolition
            nn.Softmax(dim=1)
        )
    
    def forward(self, img1, img2):
        # Extract features from both images
        feat1 = self.encoder(img1)
        feat2 = self.encoder(img2)
        
        # Concatenate features
        combined = torch.cat([feat1, feat2], dim=1)
        
        # Apply attention
        attended = self.attention(combined)
        
        # Generate predictions
        change_map = self.change_head(attended)
        vegetation_map = self.vegetation_head(attended)
        urban_map = self.urban_head(attended)
        
        return {
            'change': change_map,
            'vegetation': vegetation_map,
            'urban': urban_map
        }

"""Training script for change detection model"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from tqdm import tqdm
import os
import config
from dataset import OneraDataset, get_transforms
from model import ChangeDetectionModel

def train_epoch(model, dataloader, optimizer, device):
    model.train()
    total_loss = 0
    
    pbar = tqdm(dataloader, desc='Training')
    for batch in pbar:
        img1 = batch['img1'].to(device)
        img2 = batch['img2'].to(device)
        
        optimizer.zero_grad()
        
        # Forward pass
        outputs = model(img1, img2)
        
        # For unsupervised learning, use reconstruction loss
        # In practice, you'd use labeled data if available
        loss = torch.mean(outputs['change'])  # Placeholder loss
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
        pbar.set_postfix({'loss': loss.item()})
    
    return total_loss / len(dataloader)

def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Create datasets
    train_dataset = OneraDataset(
        cities=config.TRAIN_CITIES,
        root_dir=config.DATASET_ROOT,
        transform=get_transforms(train=True)
    )
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=config.BATCH_SIZE,
        shuffle=True,
        num_workers=config.NUM_WORKERS
    )
    
    # Initialize model
    model = ChangeDetectionModel(in_channels=13).to(device)
    optimizer = optim.Adam(model.parameters(), lr=config.LEARNING_RATE)
    
    # Training loop
    best_loss = float('inf')
    for epoch in range(config.NUM_EPOCHS):
        print(f"\nEpoch {epoch+1}/{config.NUM_EPOCHS}")
        
        train_loss = train_epoch(model, train_loader, optimizer, device)
        print(f"Train Loss: {train_loss:.4f}")
        
        # Save best model
        if train_loss < best_loss:
            best_loss = train_loss
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'loss': train_loss,
            }, os.path.join(config.MODEL_DIR, 'best_model.pth'))
            print("Model saved!")
    
    print("\nTraining completed!")

if __name__ == '__main__':
    main()

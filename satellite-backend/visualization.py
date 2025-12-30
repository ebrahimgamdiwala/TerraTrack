"""Visualization utilities for change detection results"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
import cv2

class ChangeVisualizer:
    def __init__(self):
        self.colors = {
            'no_change': [0.9, 0.9, 0.9],
            'vegetation_increase': [0.0, 0.8, 0.0],
            'vegetation_decrease': [0.8, 0.4, 0.0],
            'urban_construction': [0.8, 0.0, 0.0],
            'urban_demolition': [0.4, 0.0, 0.8],
            'water_increase': [0.0, 0.4, 0.8],
            'water_decrease': [0.8, 0.8, 0.0]
        }
    
    def create_rgb_composite(self, bands, rgb_indices=[3, 2, 1]):
        """Create RGB composite from multispectral bands"""
        rgb = np.stack([bands[i] for i in rgb_indices], axis=-1)
        # Enhance contrast
        rgb = np.clip(rgb * 2.5, 0, 1)
        return rgb
    
    def create_false_color(self, bands, indices=[7, 3, 2]):
        """Create false color composite (NIR, Red, Green)"""
        false_color = np.stack([bands[i] for i in indices], axis=-1)
        false_color = np.clip(false_color * 2.5, 0, 1)
        return false_color
    
    def create_change_overlay(self, change_map, threshold=0.5):
        """Create colored overlay for change detection"""
        h, w = change_map.shape
        overlay = np.zeros((h, w, 3))
        
        # Red for changes
        change_mask = change_map > threshold
        overlay[change_mask] = [1.0, 0.0, 0.0]
        
        return overlay
    
    def create_change_visualization(self, bands1, bands2, change_map, 
                                   vegetation_map, urban_map, output_path):
        """Create comprehensive visualization of all changes"""
        import os
        
        # Create directory for individual visualizations
        output_dir = os.path.dirname(output_path)
        viz_dir = os.path.join(output_dir, 'visualizations')
        os.makedirs(viz_dir, exist_ok=True)
        
        # RGB composites
        rgb1 = self.create_rgb_composite(bands1)
        rgb2 = self.create_rgb_composite(bands2)
        
        # False color composites
        fc1 = self.create_false_color(bands1)
        fc2 = self.create_false_color(bands2)
        
        # Calculate indices
        red1, nir1 = bands1[3], bands1[7]
        red2, nir2 = bands2[3], bands2[7]
        ndvi1 = (nir1 - red1) / (nir1 + red1 + 1e-8)
        ndvi2 = (nir2 - red2) / (nir2 + red2 + 1e-8)
        ndvi_diff = ndvi2 - ndvi1
        
        # Prepare classification maps
        veg_class = np.argmax(vegetation_map, axis=0)
        veg_colored = np.zeros((*veg_class.shape, 3))
        veg_colored[veg_class == 0] = self.colors['no_change']
        veg_colored[veg_class == 1] = self.colors['vegetation_increase']
        veg_colored[veg_class == 2] = self.colors['vegetation_decrease']
        
        urban_class = np.argmax(urban_map, axis=0)
        urban_colored = np.zeros((*urban_class.shape, 3))
        urban_colored[urban_class == 0] = self.colors['no_change']
        urban_colored[urban_class == 1] = self.colors['urban_construction']
        urban_colored[urban_class == 2] = self.colors['urban_demolition']
        
        # Change overlay
        overlay = rgb2.copy().astype(np.float32)
        change_overlay = self.create_change_overlay(change_map).astype(np.float32)
        combined = cv2.addWeighted(overlay, 0.6, change_overlay, 0.4, 0)
        combined = np.clip(combined, 0, 1)
        
        # Save individual visualizations
        visualizations = []
        
        # 1. RGB Before
        self._save_single_viz(rgb1, 'Before (RGB)', 
                             os.path.join(viz_dir, '01_rgb_before.png'))
        visualizations.append('01_rgb_before.png')
        
        # 2. RGB After
        self._save_single_viz(rgb2, 'After (RGB)', 
                             os.path.join(viz_dir, '02_rgb_after.png'))
        visualizations.append('02_rgb_after.png')
        
        # 3. False Color Before
        self._save_single_viz(fc1, 'Before (False Color - NIR/Red/Green)', 
                             os.path.join(viz_dir, '03_false_color_before.png'))
        visualizations.append('03_false_color_before.png')
        
        # 4. False Color After
        self._save_single_viz(fc2, 'After (False Color - NIR/Red/Green)', 
                             os.path.join(viz_dir, '04_false_color_after.png'))
        visualizations.append('04_false_color_after.png')
        
        # 5. Overall Change Detection
        self._save_single_viz_with_colorbar(change_map, 'Overall Change Detection', 
                                           os.path.join(viz_dir, '05_change_detection.png'),
                                           cmap='hot', vmin=0, vmax=1)
        visualizations.append('05_change_detection.png')
        
        # 6. Vegetation Changes
        self._save_single_viz(veg_colored, 'Vegetation Changes', 
                             os.path.join(viz_dir, '06_vegetation_changes.png'))
        visualizations.append('06_vegetation_changes.png')
        
        # 7. Urban Changes
        self._save_single_viz(urban_colored, 'Urban Changes', 
                             os.path.join(viz_dir, '07_urban_changes.png'))
        visualizations.append('07_urban_changes.png')
        
        # 8. Change Overlay
        self._save_single_viz(combined, 'Change Overlay on After Image', 
                             os.path.join(viz_dir, '08_change_overlay.png'))
        visualizations.append('08_change_overlay.png')
        
        # 9. NDVI Before
        self._save_single_viz_with_colorbar(ndvi1, 'NDVI Before', 
                                           os.path.join(viz_dir, '09_ndvi_before.png'),
                                           cmap='RdYlGn', vmin=-1, vmax=1)
        visualizations.append('09_ndvi_before.png')
        
        # 10. NDVI After
        self._save_single_viz_with_colorbar(ndvi2, 'NDVI After', 
                                           os.path.join(viz_dir, '10_ndvi_after.png'),
                                           cmap='RdYlGn', vmin=-1, vmax=1)
        visualizations.append('10_ndvi_after.png')
        
        # 11. NDVI Change
        self._save_single_viz_with_colorbar(ndvi_diff, 'NDVI Change (After - Before)', 
                                           os.path.join(viz_dir, '11_ndvi_change.png'),
                                           cmap='RdYlGn', vmin=-0.5, vmax=0.5)
        visualizations.append('11_ndvi_change.png')
        
        # Also create the combined visualization for backward compatibility
        self._create_combined_visualization(bands1, bands2, change_map, 
                                          vegetation_map, urban_map, output_path)
        
        print(f"✓ {len(visualizations)} individual visualizations saved to: {viz_dir}")
        return visualizations
    
    def _save_single_viz(self, image, title, output_path):
        """Save a single visualization without colorbar"""
        fig, ax = plt.subplots(figsize=(10, 8))
        ax.imshow(image)
        ax.set_title(title, fontsize=14, fontweight='bold', pad=10)
        ax.axis('off')
        plt.tight_layout()
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
    
    def _save_single_viz_with_colorbar(self, data, title, output_path, cmap='viridis', vmin=None, vmax=None):
        """Save a single visualization with colorbar"""
        fig, ax = plt.subplots(figsize=(10, 8))
        im = ax.imshow(data, cmap=cmap, vmin=vmin, vmax=vmax)
        ax.set_title(title, fontsize=14, fontweight='bold', pad=10)
        ax.axis('off')
        plt.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        plt.tight_layout()
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
    
    def _create_combined_visualization(self, bands1, bands2, change_map, 
                                      vegetation_map, urban_map, output_path):
        """Create the original combined visualization (for backward compatibility)"""
        fig = plt.figure(figsize=(20, 12))
        gs = GridSpec(3, 4, figure=fig, hspace=0.3, wspace=0.3)
        
        # RGB composites
        rgb1 = self.create_rgb_composite(bands1)
        rgb2 = self.create_rgb_composite(bands2)
        
        # False color composites
        fc1 = self.create_false_color(bands1)
        fc2 = self.create_false_color(bands2)
        
        # Row 1: Original images
        ax1 = fig.add_subplot(gs[0, 0])
        ax1.imshow(rgb1)
        ax1.set_title('Before (RGB)', fontsize=12, fontweight='bold')
        ax1.axis('off')
        
        ax2 = fig.add_subplot(gs[0, 1])
        ax2.imshow(rgb2)
        ax2.set_title('After (RGB)', fontsize=12, fontweight='bold')
        ax2.axis('off')
        
        ax3 = fig.add_subplot(gs[0, 2])
        ax3.imshow(fc1)
        ax3.set_title('Before (False Color)', fontsize=12, fontweight='bold')
        ax3.axis('off')
        
        ax4 = fig.add_subplot(gs[0, 3])
        ax4.imshow(fc2)
        ax4.set_title('After (False Color)', fontsize=12, fontweight='bold')
        ax4.axis('off')
        
        # Row 2: Change detection
        ax5 = fig.add_subplot(gs[1, 0])
        im1 = ax5.imshow(change_map, cmap='hot', vmin=0, vmax=1)
        ax5.set_title('Overall Change Detection', fontsize=12, fontweight='bold')
        ax5.axis('off')
        plt.colorbar(im1, ax=ax5, fraction=0.046)
        
        # Vegetation change
        ax6 = fig.add_subplot(gs[1, 1])
        veg_class = np.argmax(vegetation_map, axis=0)
        veg_colored = np.zeros((*veg_class.shape, 3))
        veg_colored[veg_class == 0] = self.colors['no_change']
        veg_colored[veg_class == 1] = self.colors['vegetation_increase']
        veg_colored[veg_class == 2] = self.colors['vegetation_decrease']
        ax6.imshow(veg_colored)
        ax6.set_title('Vegetation Changes', fontsize=12, fontweight='bold')
        ax6.axis('off')
        
        # Urban change
        ax7 = fig.add_subplot(gs[1, 2])
        urban_class = np.argmax(urban_map, axis=0)
        urban_colored = np.zeros((*urban_class.shape, 3))
        urban_colored[urban_class == 0] = self.colors['no_change']
        urban_colored[urban_class == 1] = self.colors['urban_construction']
        urban_colored[urban_class == 2] = self.colors['urban_demolition']
        ax7.imshow(urban_colored)
        ax7.set_title('Urban Changes', fontsize=12, fontweight='bold')
        ax7.axis('off')
        
        # Combined overlay
        ax8 = fig.add_subplot(gs[1, 3])
        overlay = rgb2.copy().astype(np.float32)
        change_overlay = self.create_change_overlay(change_map).astype(np.float32)
        combined = cv2.addWeighted(overlay, 0.6, change_overlay, 0.4, 0)
        combined = np.clip(combined, 0, 1)
        ax8.imshow(combined)
        ax8.set_title('Change Overlay', fontsize=12, fontweight='bold')
        ax8.axis('off')
        
        # Row 3: Indices
        # NDVI comparison
        red1, nir1 = bands1[3], bands1[7]
        red2, nir2 = bands2[3], bands2[7]
        ndvi1 = (nir1 - red1) / (nir1 + red1 + 1e-8)
        ndvi2 = (nir2 - red2) / (nir2 + red2 + 1e-8)
        ndvi_diff = ndvi2 - ndvi1
        
        ax9 = fig.add_subplot(gs[2, 0])
        im2 = ax9.imshow(ndvi1, cmap='RdYlGn', vmin=-1, vmax=1)
        ax9.set_title('NDVI Before', fontsize=12, fontweight='bold')
        ax9.axis('off')
        plt.colorbar(im2, ax=ax9, fraction=0.046)
        
        ax10 = fig.add_subplot(gs[2, 1])
        im3 = ax10.imshow(ndvi2, cmap='RdYlGn', vmin=-1, vmax=1)
        ax10.set_title('NDVI After', fontsize=12, fontweight='bold')
        ax10.axis('off')
        plt.colorbar(im3, ax=ax10, fraction=0.046)
        
        ax11 = fig.add_subplot(gs[2, 2])
        im4 = ax11.imshow(ndvi_diff, cmap='RdYlGn', vmin=-0.5, vmax=0.5)
        ax11.set_title('NDVI Change', fontsize=12, fontweight='bold')
        ax11.axis('off')
        plt.colorbar(im4, ax=ax11, fraction=0.046)
        
        # Legend
        ax12 = fig.add_subplot(gs[2, 3])
        ax12.axis('off')
        
        legend_elements = [
            mpatches.Patch(color=self.colors['vegetation_increase'], label='Vegetation Increase'),
            mpatches.Patch(color=self.colors['vegetation_decrease'], label='Vegetation Decrease'),
            mpatches.Patch(color=self.colors['urban_construction'], label='Urban Construction'),
            mpatches.Patch(color=self.colors['urban_demolition'], label='Urban Demolition'),
            mpatches.Patch(color=self.colors['no_change'], label='No Change')
        ]
        ax12.legend(handles=legend_elements, loc='center', fontsize=10, frameon=True)
        ax12.set_title('Legend', fontsize=12, fontweight='bold')
        
        plt.suptitle('Satellite Change Detection Analysis', fontsize=16, fontweight='bold', y=0.98)
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✓ Combined visualization saved to: {output_path}")

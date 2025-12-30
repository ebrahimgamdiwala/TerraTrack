"""
Image converter for handling PNG/JPEG satellite images
Converts user-friendly formats to the required 13-band format
"""

import numpy as np
import rasterio
from PIL import Image
import os

class ImageConverter:
    """Converts PNG/JPEG images to multi-band format for analysis"""
    
    def __init__(self):
        self.supported_formats = ['.png', '.jpg', '.jpeg', '.tif', '.tiff']
    
    def is_supported(self, filename):
        """Check if file format is supported"""
        ext = os.path.splitext(filename.lower())[1]
        return ext in self.supported_formats
    
    def convert_rgb_to_multispectral(self, rgb_image_path, output_folder):
        """
        Convert RGB image (PNG/JPEG) to simulated 13-band format
        
        This creates synthetic bands based on RGB data for demonstration.
        For real satellite analysis, use actual multi-band satellite imagery.
        
        Args:
            rgb_image_path: Path to RGB image (PNG/JPEG)
            output_folder: Where to save the 13 .tif files
        
        Returns:
            List of created .tif file paths
        """
        # Load RGB image
        img = Image.open(rgb_image_path)
        img_array = np.array(img)
        
        # Ensure RGB
        if len(img_array.shape) == 2:  # Grayscale
            img_array = np.stack([img_array] * 3, axis=-1)
        elif img_array.shape[2] == 4:  # RGBA
            img_array = img_array[:, :, :3]
        
        # Normalize to 0-1
        img_array = img_array.astype(np.float32) / 255.0
        
        # Extract RGB channels
        red = img_array[:, :, 0]
        green = img_array[:, :, 1]
        blue = img_array[:, :, 2]
        
        # Create synthetic bands based on RGB
        # This is a simplified simulation for demonstration
        bands = {
            'B01': blue * 0.9,  # Coastal aerosol (blue-ish)
            'B02': blue,  # Blue
            'B03': green,  # Green
            'B04': red,  # Red
            'B05': (red + green) / 2 * 1.1,  # Red Edge (between red and NIR)
            'B06': (red + green) / 2 * 1.2,  # Red Edge
            'B07': (red + green) / 2 * 1.3,  # Red Edge
            'B08': (1.0 - red) * 0.8,  # NIR (inverse of red, vegetation reflects NIR)
            'B09': blue * 0.7,  # Water vapor
            'B10': blue * 0.5,  # SWIR Cirrus
            'B11': (red + blue) / 2,  # SWIR (urban/soil)
            'B12': (red + blue) / 2 * 1.1,  # SWIR
            'B8A': (1.0 - red) * 0.75,  # Narrow NIR
        }
        
        # Create output folder
        os.makedirs(output_folder, exist_ok=True)
        
        # Save each band as .tif
        created_files = []
        for band_name, band_data in bands.items():
            output_path = os.path.join(output_folder, f'{band_name}.tif')
            
            # Scale to 0-10000 (typical satellite data range)
            band_data_scaled = (band_data * 10000).astype(np.uint16)
            
            # Save as GeoTIFF
            with rasterio.open(
                output_path,
                'w',
                driver='GTiff',
                height=band_data_scaled.shape[0],
                width=band_data_scaled.shape[1],
                count=1,
                dtype=band_data_scaled.dtype,
                crs=None,
                transform=None
            ) as dst:
                dst.write(band_data_scaled, 1)
            
            created_files.append(output_path)
        
        return created_files
    
    def process_user_images(self, before_image, after_image, temp_dir):
        """
        Process user-uploaded images (PNG/JPEG or TIF)
        
        Args:
            before_image: Path to before image
            after_image: Path to after image
            temp_dir: Temporary directory for processing
        
        Returns:
            Tuple of (before_folder, after_folder) with 13 bands each
        """
        before_ext = os.path.splitext(before_image.lower())[1]
        after_ext = os.path.splitext(after_image.lower())[1]
        
        before_folder = os.path.join(temp_dir, 'before_bands')
        after_folder = os.path.join(temp_dir, 'after_bands')
        
        # Convert before image
        if before_ext in ['.png', '.jpg', '.jpeg']:
            print(f"📸 Converting before image from {before_ext} to multi-band...")
            self.convert_rgb_to_multispectral(before_image, before_folder)
        else:
            # Already multi-band, just copy
            before_folder = os.path.dirname(before_image)
        
        # Convert after image
        if after_ext in ['.png', '.jpg', '.jpeg']:
            print(f"📸 Converting after image from {after_ext} to multi-band...")
            self.convert_rgb_to_multispectral(after_image, after_folder)
        else:
            # Already multi-band, just copy
            after_folder = os.path.dirname(after_image)
        
        return before_folder, after_folder


def test_converter():
    """Test the image converter"""
    import matplotlib.pyplot as plt
    
    print("Testing Image Converter...")
    print("=" * 60)
    
    # Create a test RGB image
    test_img = np.random.rand(256, 256, 3)
    test_img_path = 'test_rgb.png'
    
    # Save test image
    plt.imsave(test_img_path, test_img)
    print(f"✓ Created test RGB image: {test_img_path}")
    
    # Convert to multi-band
    converter = ImageConverter()
    output_folder = 'test_bands'
    
    created_files = converter.convert_rgb_to_multispectral(test_img_path, output_folder)
    
    print(f"\n✓ Created {len(created_files)} band files:")
    for f in created_files:
        print(f"  - {os.path.basename(f)}")
    
    print("\n" + "=" * 60)
    print("✅ Test complete!")
    print(f"\nBand files saved in: {output_folder}")
    
    # Cleanup
    os.remove(test_img_path)


if __name__ == '__main__':
    test_converter()

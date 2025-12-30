import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImageCloudinary = async (imageBuffer) => {
    try {
        // Ensure we have a proper Buffer
        let buffer;
        if (Buffer.isBuffer(imageBuffer)) {
            buffer = imageBuffer;
        } else if (imageBuffer instanceof ArrayBuffer) {
            buffer = Buffer.from(imageBuffer);
        } else if (imageBuffer?.buffer) {
            buffer = Buffer.isBuffer(imageBuffer.buffer) ? imageBuffer.buffer : Buffer.from(imageBuffer.buffer);
        } else {
            throw new Error('Invalid image data provided');
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "TerraTrack" },
                (error, uploadResult) => {
                    if (error) return reject(error);
                    resolve(uploadResult);
                }
            );
            stream.end(buffer);
        });

        return result;
        
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};

export default uploadImageCloudinary;

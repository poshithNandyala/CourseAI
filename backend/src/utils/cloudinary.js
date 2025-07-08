import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import { ApiError } from "./ApiError.js"

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration
const verifyCloudinaryConfig = () => {
    const { cloud_name, api_key, api_secret } = cloudinary.config();

    if (!cloud_name || !api_key || !api_secret) {
        console.warn('⚠️ Cloudinary configuration incomplete:', {
            cloud_name: !!cloud_name,
            api_key: !!api_key,
            api_secret: !!api_secret
        });
        return false;
    }

    console.log('✅ Cloudinary configured successfully');
    return true;
};

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new ApiError(400, "Local file path is required");
        }

        // Check if file exists
        if (!fs.existsSync(localFilePath)) {
            throw new ApiError(400, "File does not exist at the specified path");
        }

        // Verify Cloudinary configuration
        if (!verifyCloudinaryConfig()) {
            throw new ApiError(500, "Cloudinary is not properly configured. Please check environment variables.");
        }

        console.log('📤 Uploading file to Cloudinary:', localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder: 'course-ai/avatars', // Organize uploads in folders
            transformation: [
                { width: 300, height: 300, crop: 'fill', gravity: 'face' }, // Optimize for avatars
                { quality: 'auto', fetch_format: 'auto' } // Auto optimize
            ]
        });

        console.log('✅ File uploaded successfully:', response.secure_url);

        // Clean up local file after successful upload
        try {
            fs.unlinkSync(localFilePath);
            console.log('🗑️ Local file cleaned up');
        } catch (cleanupError) {
            console.warn('⚠️ Failed to cleanup local file:', cleanupError.message);
        }

        return response;

    } catch (error) {
        console.error('❌ Cloudinary upload failed:', error);

        // Clean up local file on error
        try {
            if (localFilePath && fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
                console.log('🗑️ Local file cleaned up after error');
            }
        } catch (cleanupError) {
            console.warn('⚠️ Failed to cleanup local file after error:', cleanupError.message);
        }

        // Provide more specific error messages
        if (error.http_code === 401) {
            throw new ApiError(500, "Cloudinary authentication failed. Please check API credentials.");
        } else if (error.http_code === 400) {
            throw new ApiError(400, `Cloudinary upload error: ${error.message}`);
        } else if (error.name === 'ApiError') {
            throw error; // Re-throw our own errors
        } else {
            throw new ApiError(500, `File upload failed: ${error.message || 'Unknown error'}`);
        }
    }
}

export { uploadOnCloudinary }

// Upload an image
// const uploadResult = await cloudinary.uploader
//     .upload(
//         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     }
//     )
//     .catch((error) => {
//         console.log(error);
//     });

// Upload an image
// const uploadResult = await cloudinary.uploader
//     .upload(
//         'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     }
//     )
//     .catch((error) => {
//         console.log(error);
//     });
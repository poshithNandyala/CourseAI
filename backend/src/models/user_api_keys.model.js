import mongoose, { Schema } from "mongoose";
import CryptoJS from "crypto-js";

const userApiKeysSchema = new Schema(
    {
        user_id: {
            type: String,
            required: true,
            ref: 'User',
            unique: true,
            index: true
        },
        gemini_api_key: {
            type: String,
            default: null
        },
        youtube_api_key: {
            type: String,
            default: null
        },
        gemini_key_status: {
            type: String,
            enum: ['not_set', 'valid', 'invalid', 'quota_exceeded'],
            default: 'not_set'
        },
        youtube_key_status: {
            type: String,
            enum: ['not_set', 'valid', 'invalid', 'quota_exceeded'],
            default: 'not_set'
        },
        last_validated_at: {
            type: Date,
            default: null
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    }
);

// Encrypt API keys before saving
userApiKeysSchema.pre("save", function (next) {
    if (this.isModified("gemini_api_key") && this.gemini_api_key) {
        this.gemini_api_key = CryptoJS.AES.encrypt(
            this.gemini_api_key, 
            process.env.ENCRYPTION_SECRET || 'default-secret-key'
        ).toString();
    }
    
    if (this.isModified("youtube_api_key") && this.youtube_api_key) {
        this.youtube_api_key = CryptoJS.AES.encrypt(
            this.youtube_api_key, 
            process.env.ENCRYPTION_SECRET || 'default-secret-key'
        ).toString();
    }
    
    this.updated_at = new Date();
    next();
});

// Method to decrypt and get Gemini API key
userApiKeysSchema.methods.getDecryptedGeminiKey = function () {
    if (!this.gemini_api_key) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(this.gemini_api_key, process.env.ENCRYPTION_SECRET || 'default-secret-key');
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Failed to decrypt Gemini API key:', error);
        return null;
    }
};

// Method to decrypt and get YouTube API key
userApiKeysSchema.methods.getDecryptedYouTubeKey = function () {
    if (!this.youtube_api_key) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(this.youtube_api_key, process.env.ENCRYPTION_SECRET || 'default-secret-key');
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Failed to decrypt YouTube API key:', error);
        return null;
    }
};

// Method to check if user has valid API keys
userApiKeysSchema.methods.hasValidKeys = function () {
    return {
        gemini: this.gemini_key_status === 'valid',
        youtube: this.youtube_key_status === 'valid',
        both: this.gemini_key_status === 'valid' && this.youtube_key_status === 'valid'
    };
};

export const UserApiKeys = mongoose.model("UserApiKeys", userApiKeysSchema);

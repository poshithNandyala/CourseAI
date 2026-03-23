import { UserApiKeys } from "../models/user_api_keys.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Validate Gemini API key
const validateGeminiApiKey = async (apiKey) => {
    try {
        console.log('🔍 Validating Gemini API key...');
        
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Test"
                    }]
                }]
            })
        });

        if (response.ok) {
            console.log('✅ Gemini API key is valid');
            return { valid: true, error: null };
        } else {
            const errorData = await response.json();
            console.log('❌ Gemini API key validation failed:', errorData);
            return { valid: false, error: errorData.error?.message || 'Invalid API key' };
        }
    } catch (error) {
        console.error('❌ Gemini API validation error:', error);
        return { valid: false, error: 'Network error or invalid key format' };
    }
};

// Validate YouTube API key
const validateYouTubeApiKey = async (apiKey) => {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&type=video&key=${apiKey}`);
        if (response.ok) {
            return { valid: true, error: null };
        } else {
            const errorData = await response.json();
            return { valid: false, error: errorData.error?.message || 'Invalid API key' };
        }
    } catch (error) {
        return { valid: false, error: 'Network error or invalid key format' };
    }
};

// Get user's API keys status
const getApiKeysStatus = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    let userApiKeys = await UserApiKeys.findOne({ user_id: userId });

    if (!userApiKeys) {
        // Create default entry for new user
        userApiKeys = await UserApiKeys.create({
            user_id: userId
        });
    }

    return res.status(200).json(
        new ApiResponse(200, {
            gemini: {
                configured: !!userApiKeys.gemini_api_key,
                status: userApiKeys.gemini_key_status,
                lastValidated: userApiKeys.last_validated_at
            },
            youtube: {
                configured: !!userApiKeys.youtube_api_key,
                status: userApiKeys.youtube_key_status,
                lastValidated: userApiKeys.last_validated_at
            }
        }, "API keys status retrieved successfully")
    );
});

// Update user's API keys
const updateApiKeys = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    const { geminiApiKey, youtubeApiKey } = req.body;

    if (!geminiApiKey && !youtubeApiKey) {
        throw new ApiError(400, "At least one API key is required");
    }

    let userApiKeys = await UserApiKeys.findOne({ user_id: userId });

    if (!userApiKeys) {
        userApiKeys = new UserApiKeys({ user_id: userId });
    }

    const validationResults = {
        gemini: { valid: true, error: null },
        youtube: { valid: true, error: null }
    };

    // Validate and update Gemini API key
    if (geminiApiKey) {
        if (geminiApiKey.trim() === '') {
            // User wants to remove the key
            userApiKeys.gemini_api_key = null;
            userApiKeys.gemini_key_status = 'not_set';
        } else {
            const validation = await validateGeminiApiKey(geminiApiKey);
            validationResults.gemini = validation;

            if (validation.valid) {
                userApiKeys.gemini_api_key = geminiApiKey;
                userApiKeys.gemini_key_status = 'valid';
                console.log('✅ Gemini API key saved and validated');
            } else {
                userApiKeys.gemini_key_status = 'invalid';
                console.log('❌ Gemini API key invalid, not saved');
                // Don't save invalid keys
            }
        }
    }

    // Validate and update YouTube API key
    if (youtubeApiKey) {
        if (youtubeApiKey.trim() === '') {
            // User wants to remove the key
            userApiKeys.youtube_api_key = null;
            userApiKeys.youtube_key_status = 'not_set';
        } else {
            const validation = await validateYouTubeApiKey(youtubeApiKey);
            validationResults.youtube = validation;

            if (validation.valid) {
                userApiKeys.youtube_api_key = youtubeApiKey;
                userApiKeys.youtube_key_status = 'valid';
            } else {
                userApiKeys.youtube_key_status = 'invalid';
                // Don't save invalid keys
            }
        }
    }

    userApiKeys.last_validated_at = new Date();
    await userApiKeys.save();

    // Prepare response
    const response = {
        success: true,
        gemini: {
            configured: !!userApiKeys.gemini_api_key,
            status: userApiKeys.gemini_key_status,
            valid: validationResults.gemini.valid,
            error: validationResults.gemini.error
        },
        youtube: {
            configured: !!userApiKeys.youtube_api_key,
            status: userApiKeys.youtube_key_status,
            valid: validationResults.youtube.valid,
            error: validationResults.youtube.error
        }
    };

    const hasErrors = !validationResults.gemini.valid || !validationResults.youtube.valid;

    return res.status(hasErrors ? 400 : 200).json(
        new ApiResponse(
            hasErrors ? 400 : 200,
            response,
            hasErrors ? "Some API keys are invalid" : "API keys updated successfully"
        )
    );
});

// Get decrypted API keys for internal use (protected endpoint)
const getDecryptedApiKeys = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    const userApiKeys = await UserApiKeys.findOne({ user_id: userId });

    if (!userApiKeys) {
        throw new ApiError(404, "API keys not found. Please configure your API keys first.");
    }

    const hasValidKeys = userApiKeys.hasValidKeys();

    if (!hasValidKeys.both) {
        throw new ApiError(400, "Valid API keys are required. Please update your API keys in settings.");
    }

    return res.status(200).json(
        new ApiResponse(200, {
            geminiApiKey: userApiKeys.getDecryptedGeminiKey(),
            youtubeApiKey: userApiKeys.getDecryptedYouTubeKey()
        }, "API keys retrieved successfully")
    );
});

// Delete user's API keys
const deleteApiKeys = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "User not authenticated");
    }

    await UserApiKeys.findOneAndUpdate(
        { user_id: userId },
        {
            gemini_api_key: null,
            youtube_api_key: null,
            gemini_key_status: 'not_set',
            youtube_key_status: 'not_set',
            updated_at: new Date()
        },
        { upsert: true }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "API keys deleted successfully")
    );
});

export {
    getApiKeysStatus,
    updateApiKeys,
    getDecryptedApiKeys,
    deleteApiKeys
};

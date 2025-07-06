import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const VerifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request: Access token is missing")
        }

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError.message);
            if (jwtError.name === 'TokenExpiredError') {
                throw new ApiError(401, "Access token has expired");
            } else if (jwtError.name === 'JsonWebTokenError') {
                throw new ApiError(401, "Invalid access token");
            }
            throw new ApiError(401, "Token verification failed");
        }
        
        const user = await User.findById(decodedToken?._id).select("-password_hash -refresh_token")
        
        if (!user) {
            console.error('User not found for token:', decodedToken?._id);
            throw new ApiError(401, "Invalid access token: User not found")
        }

        // Add user data for frontend compatibility
        const userObject = user.toObject();
        userObject.name = userObject.fullname;

        req.user = userObject;
        next()
    } catch (error) {
        console.error('Auth middleware error:', error);
        throw new ApiError(
            error?.statusCode || 401,
            error?.message || "Authentication failed"
        )
    }
})

// Optional JWT verification - doesn't throw error if no token
export const OptionalVerifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (token) {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            const user = await User.findById(decodedToken?._id).select("-password_hash -refresh_token")
            
            if (user) {
                req.user = user
            }
        }
        
        next()
    } catch (error) {
        // Continue without user if token is invalid
        next()
    }
})
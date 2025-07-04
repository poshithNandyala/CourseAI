import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { CourseLike } from "../models/course_like.model.js";
import { Course } from '../models/course.model.js';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found while generating tokens");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refresh_token = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error('Token generation error:', error);
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    console.log('📝 Registration request received:', req.body);

    const { _id, fullname, email, username, password } = req.body;

    // Validation
    if ([fullname, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Please enter a valid email address");
    }

    // Password validation
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    // Create user ID if not provided
    const userId = _id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
        const user = await User.create({
            _id: userId,
            fullname: fullname.trim(),
            email: email.toLowerCase().trim(),
            password_hash: password,
            username: username.toLowerCase().trim(),
        });

        const createdUser = await User.findById(user._id).select("-password_hash -refresh_token");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        console.log('✅ User registered successfully:', createdUser.email);

        return res.status(201).json(
            new ApiResponse(201, createdUser, "User registered successfully")
        );
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            throw new ApiError(409, "User with this email or username already exists");
        }
        throw new ApiError(500, "Failed to register user");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    console.log('🔐 Login request received:', { email: req.body.email, username: req.body.username });

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    try {
        const user = await User.findOne({
            $or: [
                { username: username?.toLowerCase() },
                { email: email?.toLowerCase() }
            ]
        });

        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid user credentials");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
        let loggedInUser = await User.findById(user._id).select("-password_hash -refresh_token");

        // Patch: Add 'name' field for frontend compatibility
        loggedInUser = loggedInUser.toObject();
        loggedInUser.name = loggedInUser.fullname;

        console.log('✅ User logged in successfully:', loggedInUser.email);

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User logged in successfully"));
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refresh_token: 1 } },
        { new: true }
    );

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: Refresh token is missing");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refresh_token) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(new ApiResponse(200, {
                accessToken,
                refreshToken: newRefreshToken
            }, "Access token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password_hash = newPassword;
    await user.save({ validateBeforeSave: true });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user data fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname && !email) {
        throw new ApiError(400, "At least one field (fullname or email) must be provided");
    }

    const updateData = {};
    if (fullname) updateData.fullname = fullname.trim();
    if (email) updateData.email = email.toLowerCase().trim();

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select("-password_hash -refresh_token");

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar_url: avatar.url } },
        { new: true }
    ).select("-password_hash -refresh_token");

    return res.status(200).json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const getLikedCourses = asyncHandler(async (req, res) => {
    const likedCourses = await CourseLike.aggregate([
        {
            $match: {
                user_id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "courses",
                localField: "course_id",
                foreignField: "_id",
                as: "likedCourse",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner_id",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedCourse",
        },
        {
            $project: {
                _id: 0,
                course: "$likedCourse"
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200, likedCourses, "Liked courses fetched successfully"));
});

const getMyPublishedCoursesLikes = asyncHandler(async (req, res) => {
    // Find all published courses owned by the user
    const publishedCourses = await Course.find({ owner_id: req.user._id, is_published: true }, { _id: 1 });
    const courseIds = publishedCourses.map(c => c._id);

    if (courseIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, { totalLikes: 0 }, "No published courses found"));
    }

    // Count likes for these courses
    const totalLikes = await CourseLike.countDocuments({ course_id: { $in: courseIds } });
    return res.status(200).json(new ApiResponse(200, { totalLikes }, "Total likes for your published courses"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getLikedCourses,
    getMyPublishedCoursesLikes,
};
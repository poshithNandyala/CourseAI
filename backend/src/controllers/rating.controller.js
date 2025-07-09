import { CourseRating } from "../models/course_rating.model.js";
import { Course } from "../models/course.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

/**
 * Submit or update a course rating
 */
const submitCourseRating = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user._id;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new ApiError(400, "Rating must be an integer between 1 and 5");
    }

    // Check if user has already rated this course
    let existingRating = await CourseRating.findOne({
        course_id: courseId,
        user_id: userId
    });

    let courseRating;
    let isUpdate = false;

    if (existingRating) {
        // Update existing rating
        existingRating.rating = rating;
        if (review !== undefined) {
            existingRating.review = review;
        }
        courseRating = await existingRating.save();
        isUpdate = true;
    } else {
        // Create new rating
        courseRating = await CourseRating.create({
            course_id: courseId,
            user_id: userId,
            rating,
            review
        });
    }

    // Get updated course statistics
    const stats = await CourseRating.calculateAverageRating(courseId);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                rating: courseRating,
                courseStats: stats,
                isUpdate
            },
            isUpdate ? "Rating updated successfully" : "Rating submitted successfully"
        )
    );
});

/**
 * Get user's rating for a specific course
 */
const getUserCourseRating = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user._id;

    const rating = await CourseRating.findOne({
        course_id: courseId,
        user_id: userId
    });

    if (!rating) {
        throw new ApiError(404, "User has not rated this course");
    }

    return res.status(200).json(
        new ApiResponse(200, { rating: rating.rating, review: rating.review }, "User rating retrieved successfully")
    );
});

/**
 * Get all ratings for a course
 */
const getCourseRatings = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    // Get ratings with pagination
    const ratings = await CourseRating.find({ course_id: courseId })
        .populate("user_id", "name avatar_url")
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

    // Get course statistics
    const stats = await CourseRating.calculateAverageRating(courseId);

    // Get total count for pagination
    const totalRatings = await CourseRating.countDocuments({ course_id: courseId });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                ratings,
                stats,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRatings / limit),
                    totalRatings,
                    hasNextPage: page < Math.ceil(totalRatings / limit),
                    hasPrevPage: page > 1
                }
            },
            "Course ratings retrieved successfully"
        )
    );
});

/**
 * Delete user's rating for a course
 */
const deleteCourseRating = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user._id;

    const rating = await CourseRating.findOne({
        course_id: courseId,
        user_id: userId
    });

    if (!rating) {
        throw new ApiError(404, "Rating not found");
    }

    await CourseRating.findOneAndDelete({
        course_id: courseId,
        user_id: userId
    });

    // Get updated course statistics
    const stats = await CourseRating.calculateAverageRating(courseId);

    return res.status(200).json(
        new ApiResponse(
            200,
            { courseStats: stats },
            "Rating deleted successfully"
        )
    );
});

/**
 * Get rating statistics for a course
 */
const getCourseRatingStats = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    const stats = await CourseRating.calculateAverageRating(courseId);

    return res.status(200).json(
        new ApiResponse(200, stats, "Rating statistics retrieved successfully")
    );
});

export {
    submitCourseRating,
    getUserCourseRating,
    getCourseRatings,
    deleteCourseRating,
    getCourseRatingStats
};

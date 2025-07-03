import mongoose from 'mongoose';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Course } from "../models/course.model.js";
import { Lesson } from "../models/lesson.model.js";
import { CourseLike } from "../models/course_like.model.js";
import { CourseComment } from "../models/course_comment.model.js";
import { CourseRating } from "../models/course_rating.model.js";

// Create a new course with lessons and video data
const createCourse = asyncHandler(async (req, res) => {
    console.log('📝 Course creation request received');
    console.log('📊 Request body keys:', Object.keys(req.body));
    console.log('📊 Lessons count:', req.body.lessons?.length || 0);
    
    const { 
        title, 
        description, 
        difficulty, 
        estimated_duration, 
        tags, 
        lessons,
        is_published = false 
    } = req.body;

    // Validation
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
        throw new ApiError(400, "At least one lesson is required");
    }

    // Validate lessons structure
    for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        if (!lesson.title || !lesson.content) {
            throw new ApiError(400, `Lesson ${i + 1} must have title and content`);
        }
    }

    try {
        console.log('🏗️ Creating course with title:', title);
        
        // Create course
        const course = await Course.create({
            title: title.trim(),
            description: description.trim(),
            difficulty: difficulty || 'beginner',
            estimated_duration: estimated_duration || 0,
            tags: tags || [],
            owner_id: req.user._id,
            is_published
        });

        console.log('✅ Course created with ID:', course._id);

        // Create lessons with video data
        const lessonsToCreate = lessons.map((lesson, index) => {
            console.log(`📝 Processing lesson ${index + 1}: ${lesson.title}`);
            console.log(`🎥 Video data count: ${lesson.video_data?.length || 0}`);
            
            return {
                course_id: course._id,
                title: lesson.title,
                content: lesson.content,
                type: lesson.type || 'article',
                order: lesson.order || index + 1,
                video_url: lesson.video_url || '',
                video_data: lesson.video_data || [], // Store complete video information
                quiz_questions: lesson.quiz_questions || [],
                resources: lesson.resources || [],
                estimated_duration: lesson.estimated_duration || 30
            };
        });

        console.log('📚 Creating', lessonsToCreate.length, 'lessons');
        const createdLessons = await Lesson.insertMany(lessonsToCreate);
        console.log('✅ Lessons created successfully');

        // Populate course with creator info
        const populatedCourse = await Course.findById(course._id)
            .populate('owner_id', 'username fullname avatar_url')
            .lean();

        console.log('🎉 Course creation completed successfully');

        return res.status(201).json(
            new ApiResponse(201, {
                course: populatedCourse,
                lessons: createdLessons
            }, "Course created successfully")
        );

    } catch (error) {
        console.error("❌ Error creating course:", error);
        
        // Provide more specific error messages
        if (error.code === 11000) {
            throw new ApiError(409, "A course with this title already exists");
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            throw new ApiError(400, `Validation error: ${validationErrors.join(', ')}`);
        }
        
        throw new ApiError(500, "Failed to create course");
    }
});

// Get all published courses for explore page
const getPublishedCourses = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 12, 
        search = '', 
        difficulty = '', 
        sortBy = 'createdAt',
        sortOrder = 'desc' 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build match conditions
    const matchConditions = { is_published: true };

    // Add search filter
    if (search) {
        matchConditions.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }

    // Add difficulty filter
    if (difficulty && difficulty !== 'all') {
        matchConditions.difficulty = difficulty;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    try {
        const aggregationPipeline = [
            { $match: matchConditions },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner_id',
                    foreignField: '_id',
                    as: 'creator',
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullname: 1,
                                avatar_url: 1
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: '$creator',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    creator: {
                        name: '$creator.fullname',
                        avatar_url: '$creator.avatar_url'
                    }
                }
            },
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limitNum }
        ];

        const courses = await Course.aggregate(aggregationPipeline);

        // Get total count for pagination
        const totalCourses = await Course.countDocuments(matchConditions);
        const totalPages = Math.ceil(totalCourses / limitNum);

        return res.status(200).json(
            new ApiResponse(200, {
                courses,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCourses,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            }, "Published courses fetched successfully")
        );

    } catch (error) {
        console.error("Error fetching published courses:", error);
        throw new ApiError(500, "Failed to fetch courses");
    }
});

// Get single course with lessons and video data (public access)
const getCourseById = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    try {
        // Get course with creator info
        const course = await Course.findOne({ 
            _id: courseId, 
            is_published: true 
        })
        .populate('owner_id', 'username fullname avatar_url')
        .lean();

        if (!course) {
            throw new ApiError(404, "Course not found or not published");
        }

        // Get lessons with video data
        const lessons = await Lesson.find({ course_id: courseId })
            .sort({ order: 1 })
            .lean();

        // Format creator info
        const formattedCourse = {
            ...course,
            creator: {
                name: course.owner_id?.fullname || 'Anonymous',
                avatar_url: course.owner_id?.avatar_url
            }
        };

        // Remove owner_id from response
        delete formattedCourse.owner_id;

        // Increment view count
        await Course.findByIdAndUpdate(courseId, { 
            $inc: { views_count: 1 } 
        });

        return res.status(200).json(
            new ApiResponse(200, {
                course: formattedCourse,
                lessons
            }, "Course fetched successfully")
        );

    } catch (error) {
        console.error("Error fetching course:", error);
        throw new ApiError(500, "Failed to fetch course");
    }
});

// Get user's own courses (both published and unpublished)
const getUserCourses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    try {
        const courses = await Course.find({ owner_id: req.user._id })
            .populate('owner_id', 'username fullname avatar_url')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const totalCourses = await Course.countDocuments({ owner_id: req.user._id });

        // Format courses
        const formattedCourses = courses.map(course => ({
            ...course,
            creator: {
                name: course.owner_id?.fullname || 'Anonymous',
                avatar_url: course.owner_id?.avatar_url
            }
        }));

        return res.status(200).json(
            new ApiResponse(200, {
                courses: formattedCourses,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalCourses / limitNum),
                    totalCourses
                }
            }, "User courses fetched successfully")
        );

    } catch (error) {
        console.error("Error fetching user courses:", error);
        throw new ApiError(500, "Failed to fetch user courses");
    }
});

// Get course with lessons for editing (owner only)
const getCourseForEdit = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    try {
        // Check if user owns the course
        const course = await Course.findOne({ 
            _id: courseId, 
            owner_id: req.user._id 
        })
        .populate('owner_id', 'username fullname avatar_url')
        .lean();

        if (!course) {
            throw new ApiError(404, "Course not found or you don't have permission");
        }

        // Get lessons with video data
        const lessons = await Lesson.find({ course_id: courseId })
            .sort({ order: 1 })
            .lean();

        return res.status(200).json(
            new ApiResponse(200, {
                course,
                lessons
            }, "Course fetched for editing")
        );

    } catch (error) {
        console.error("Error fetching course for edit:", error);
        throw new ApiError(500, "Failed to fetch course");
    }
});

// Publish/Unpublish course
const toggleCoursePublication = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { is_published } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    try {
        const course = await Course.findOneAndUpdate(
            { _id: courseId, owner_id: req.user._id },
            { is_published: Boolean(is_published) },
            { new: true }
        );

        if (!course) {
            throw new ApiError(404, "Course not found or you don't have permission");
        }

        return res.status(200).json(
            new ApiResponse(200, course, `Course ${is_published ? 'published' : 'unpublished'} successfully`)
        );

    } catch (error) {
        console.error("Error toggling course publication:", error);
        throw new ApiError(500, "Failed to update course");
    }
});

// Like/Unlike course
const toggleCourseLike = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    try {
        // Check if course exists and is published
        const course = await Course.findOne({ _id: courseId, is_published: true });
        if (!course) {
            throw new ApiError(404, "Course not found or not published");
        }

        // Check if user already liked the course
        const existingLike = await CourseLike.findOne({
            course_id: courseId,
            user_id: req.user._id
        });

        if (existingLike) {
            // Unlike the course
            await CourseLike.deleteOne({ _id: existingLike._id });
            await Course.findByIdAndUpdate(courseId, { 
                $inc: { likes_count: -1 } 
            });

            return res.status(200).json(
                new ApiResponse(200, { isLiked: false }, "Course unliked successfully")
            );
        } else {
            // Like the course
            await CourseLike.create({
                course_id: courseId,
                user_id: req.user._id
            });
            await Course.findByIdAndUpdate(courseId, { 
                $inc: { likes_count: 1 } 
            });

            return res.status(200).json(
                new ApiResponse(200, { isLiked: true }, "Course liked successfully")
            );
        }

    } catch (error) {
        console.error("Error toggling course like:", error);
        throw new ApiError(500, "Failed to toggle like");
    }
});

// Rate course
const rateCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { rating } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    try {
        // Check if course exists and is published
        const course = await Course.findOne({ _id: courseId, is_published: true });
        if (!course) {
            throw new ApiError(404, "Course not found or not published");
        }

        // Upsert rating
        await CourseRating.findOneAndUpdate(
            { course_id: courseId, user_id: req.user._id },
            { rating: parseInt(rating) },
            { upsert: true, new: true }
        );

        // Recalculate course rating
        const ratings = await CourseRating.aggregate([
            { $match: { course_id: new mongoose.Types.ObjectId(courseId) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        const { averageRating, totalRatings } = ratings[0] || { averageRating: 0, totalRatings: 0 };

        await Course.findByIdAndUpdate(courseId, {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            ratings_count: totalRatings
        });

        return res.status(200).json(
            new ApiResponse(200, { rating: parseInt(rating) }, "Course rated successfully")
        );

    } catch (error) {
        console.error("Error rating course:", error);
        throw new ApiError(500, "Failed to rate course");
    }
});

// Add comment to course
const addCourseComment = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { content, parent_comment_id } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    if (!content || content.trim().length === 0) {
        throw new ApiError(400, "Comment content is required");
    }

    try {
        // Check if course exists and is published
        const course = await Course.findOne({ _id: courseId, is_published: true });
        if (!course) {
            throw new ApiError(404, "Course not found or not published");
        }

        const comment = await CourseComment.create({
            course_id: courseId,
            user_id: req.user._id,
            content: content.trim(),
            parent_comment_id: parent_comment_id || null
        });

        // Populate user info
        const populatedComment = await CourseComment.findById(comment._id)
            .populate('user_id', 'username fullname avatar_url')
            .lean();

        return res.status(201).json(
            new ApiResponse(201, populatedComment, "Comment added successfully")
        );

    } catch (error) {
        console.error("Error adding comment:", error);
        throw new ApiError(500, "Failed to add comment");
    }
});

// Get course comments
const getCourseComments = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    try {
        const comments = await CourseComment.find({ 
            course_id: courseId,
            is_deleted: false 
        })
        .populate('user_id', 'username fullname avatar_url')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

        // Format comments
        const formattedComments = comments.map(comment => ({
            id: comment._id,
            content: comment.content,
            likes_count: comment.likes_count,
            created_at: comment.createdAt,
            user: {
                name: comment.user_id?.fullname || 'Anonymous',
                avatar_url: comment.user_id?.avatar_url
            }
        }));

        return res.status(200).json(
            new ApiResponse(200, formattedComments, "Comments fetched successfully")
        );

    } catch (error) {
        console.error("Error fetching comments:", error);
        throw new ApiError(500, "Failed to fetch comments");
    }
});

// Delete course (owner only)
const deleteCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    try {
        // Check if user owns the course
        const course = await Course.findOne({ 
            _id: courseId, 
            owner_id: req.user._id 
        });

        if (!course) {
            throw new ApiError(404, "Course not found or you don't have permission");
        }

        // Delete lessons first
        await Lesson.deleteMany({ course_id: courseId });

        // Delete related data
        await CourseLike.deleteMany({ course_id: courseId });
        await CourseComment.deleteMany({ course_id: courseId });
        await CourseRating.deleteMany({ course_id: courseId });

        // Delete course
        await Course.findByIdAndDelete(courseId);

        return res.status(200).json(
            new ApiResponse(200, {}, "Course deleted successfully")
        );

    } catch (error) {
        console.error("Error deleting course:", error);
        throw new ApiError(500, "Failed to delete course");
    }
});

// Get user interaction with course (like status, rating)
const getUserCourseInteraction = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
        throw new ApiError(400, "Invalid course ID");
    }

    try {
        // Check if user liked the course
        const like = await CourseLike.findOne({
            course_id: courseId,
            user_id: req.user._id
        });

        // Check user's rating
        const rating = await CourseRating.findOne({
            course_id: courseId,
            user_id: req.user._id
        });

        return res.status(200).json(
            new ApiResponse(200, {
                isLiked: !!like,
                userRating: rating?.rating || 0
            }, "User interaction fetched successfully")
        );

    } catch (error) {
        console.error("Error fetching user interaction:", error);
        throw new ApiError(500, "Failed to fetch user interaction");
    }
});

export {
    createCourse,
    getPublishedCourses,
    getCourseById,
    getUserCourses,
    getCourseForEdit,
    toggleCoursePublication,
    toggleCourseLike,
    rateCourse,
    addCourseComment,
    getCourseComments,
    deleteCourse,
    getUserCourseInteraction
};
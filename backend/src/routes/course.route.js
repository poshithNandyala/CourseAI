import { Router } from "express";
import {
    createCourse,
    getPublishedCourses,
    getCourseById,
    getUserCourses,
    getCourseForEdit,
    toggleCoursePublication,
    toggleCourseLike,
    rateCourse,
    getUserCourseRating,
    getCourseRatings,
    deleteCourseRating,
    addCourseComment,
    updateCourseComment,
    deleteCourseComment,
    toggleCommentLike,
    getCourseComments,
    deleteCourse,
    getUserCourseInteraction
} from '../controllers/course.controller.js';
import { VerifyJWT, OptionalVerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Optional authentication middleware
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Use the existing VerifyJWT logic, but don't error if missing
        return VerifyJWT(req, res, next);
    }
    next();
}

router.route('/my-courses').get(VerifyJWT, getUserCourses);

// Public routes (no authentication required)
router.route('/published').get(getPublishedCourses);
router.route('/:courseId').get(OptionalVerifyJWT, getCourseById);
router.route('/:courseId/comments').get(getCourseComments);

// Protected routes (authentication required)
router.route('/').post(VerifyJWT, createCourse);
router.route('/:courseId/edit').get(VerifyJWT, getCourseForEdit);
router.route('/:courseId/publish').patch(VerifyJWT, toggleCoursePublication);
router.route('/:courseId/like').post(VerifyJWT, toggleCourseLike);
router.route('/:courseId/rate').post(VerifyJWT, rateCourse);
router.route('/:courseId/rating').delete(VerifyJWT, deleteCourseRating);
router.route('/:courseId/rating/user').get(VerifyJWT, getUserCourseRating);
router.route('/:courseId/ratings').get(getCourseRatings);
router.route('/:courseId/comments').post(VerifyJWT, addCourseComment);
router.route('/:courseId/comments/:commentId').put(VerifyJWT, updateCourseComment);
router.route('/:courseId/comments/:commentId').delete(VerifyJWT, deleteCourseComment);
router.route('/:courseId/comments/:commentId/like').post(VerifyJWT, toggleCommentLike);
router.route('/:courseId/interaction').get(VerifyJWT, getUserCourseInteraction);
router.route('/:courseId').delete(VerifyJWT, deleteCourse);

export default router;
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
    addCourseComment,
    getCourseComments,
    deleteCourse,
    getUserCourseInteraction
} from '../controllers/course.controller.js';
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes (no authentication required)
router.route('/published').get(getPublishedCourses);
router.route('/:courseId').get(getCourseById);
router.route('/:courseId/comments').get(getCourseComments);

// Protected routes (authentication required)
router.route('/').post(VerifyJWT, createCourse);
router.route('/my-courses').get(VerifyJWT, getUserCourses);
router.route('/:courseId/edit').get(VerifyJWT, getCourseForEdit);
router.route('/:courseId/publish').patch(VerifyJWT, toggleCoursePublication);
router.route('/:courseId/like').post(VerifyJWT, toggleCourseLike);
router.route('/:courseId/rate').post(VerifyJWT, rateCourse);
router.route('/:courseId/comments').post(VerifyJWT, addCourseComment);
router.route('/:courseId/interaction').get(VerifyJWT, getUserCourseInteraction);
router.route('/:courseId').delete(VerifyJWT, deleteCourse);

export default router;
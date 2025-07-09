import { Router } from "express";
import {
    submitCourseRating,
    getUserCourseRating,
    getCourseRatings,
    deleteCourseRating,
    getCourseRatingStats
} from "../controllers/rating.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All rating routes require authentication
router.use(VerifyJWT);

// Course rating routes
router.route("/courses/:courseId/rating")
    .post(submitCourseRating)     // Submit or update rating
    .delete(deleteCourseRating);  // Delete rating

router.route("/courses/:courseId/rating/user")
    .get(getUserCourseRating);    // Get user's rating for course

router.route("/courses/:courseId/ratings")
    .get(getCourseRatings);       // Get all ratings for course (public, but auth required for now)

router.route("/courses/:courseId/ratings/stats")
    .get(getCourseRatingStats);   // Get rating statistics for course

export default router;

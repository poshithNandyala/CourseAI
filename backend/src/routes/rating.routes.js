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

// Public rating routes (no auth required)
router.route("/courses/:courseId/ratings")
    .get(getCourseRatings);       // Get all ratings for course (public)

router.route("/courses/:courseId/ratings/stats")
    .get(getCourseRatingStats);   // Get rating statistics for course (public)

// Protected rating routes (auth required)
router.use(VerifyJWT);

// Course rating routes
router.route("/courses/:courseId/rating")
    .post(submitCourseRating)     // Submit or update rating
    .delete(deleteCourseRating);  // Delete rating

router.route("/courses/:courseId/rating/user")
    .get(getUserCourseRating);    // Get user's rating for course

export default router;

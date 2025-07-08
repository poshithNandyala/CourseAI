import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getLikedCourses,
    getMyPublishedCoursesLikes,
    deleteUserAccount
} from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route('/register').post(
    upload.single('avatar'),
    registerUser
)
router.route("/login").post(loginUser)

// Protected routes
router.route("/logout").post(VerifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(VerifyJWT, changeCurrentPassword)
router.route("/profile").get(VerifyJWT, getCurrentUser)
router.route("/update").put(VerifyJWT, updateAccountDetails)
router.route("/avatar").post(VerifyJWT, upload.single('avatar'), updateUserAvatar)
router.route("/liked-courses").get(VerifyJWT, getLikedCourses)
router.route("/my-published-courses-likes").get(VerifyJWT, getMyPublishedCoursesLikes)
router.route("/delete-account").delete(VerifyJWT, deleteUserAccount)

export default router
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
    getLikedCourses
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
router.route("/update-account").patch(VerifyJWT, updateAccountDetails)
router.route("/update-avatar").patch(VerifyJWT, upload.single('avatar'), updateUserAvatar)
router.route("/liked-courses").get(VerifyJWT, getLikedCourses)

export default router
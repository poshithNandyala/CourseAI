import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Verification } from '../models/verification.model.js';
import { User } from '../models/user.model.js';
import { generateOTP, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

// Send verification code for signup
export const sendSignupVerification = asyncHandler(async (req, res) => {
    const { email, fullname, username, password } = req.body;

    console.log('📧 Signup verification request:', email);

    // Validation
    if ([email, fullname, username, password].some((field) => !field || field.trim() === "")) {
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
    const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    try {
        // Delete any existing verification for this email
        await Verification.deleteMany({ email: email.toLowerCase(), type: 'signup' });

        // Generate OTP
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store verification data
        const verification = await Verification.create({
            email: email.toLowerCase(),
            code,
            type: 'signup',
            expires_at: expiresAt,
            user_data: {
                fullname: fullname.trim(),
                email: email.toLowerCase().trim(),
                username: username.toLowerCase().trim(),
                password
            }
        });

        // Send verification email
        await sendVerificationEmail(email, code, fullname);

        console.log('✅ Verification email sent (or logged in development):', email);

        return res.status(200).json(
            new ApiResponse(200, { 
                message: "Verification code sent to your email",
                email: email.toLowerCase(),
                expires_in: 600 // 10 minutes in seconds
            }, "Verification code sent successfully")
        );

    } catch (error) {
        console.error('❌ Signup verification error:', error);
        if (error.message.includes('email')) {
            throw new ApiError(500, "Failed to send verification email. Please check your email address.");
        }
        throw new ApiError(500, "Failed to send verification code");
    }
});

// Verify signup code and create user
export const verifySignupCode = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    console.log('🔍 Verifying signup code:', email, code);

    if (!email || !code) {
        throw new ApiError(400, "Email and verification code are required");
    }

    try {
        // Find verification record
        const verification = await Verification.findOne({
            email: email.toLowerCase(),
            type: 'signup',
            verified: false
        });

        if (!verification) {
            throw new ApiError(404, "Verification code not found or already used");
        }

        // Check if expired
        if (verification.expires_at < new Date()) {
            await Verification.deleteOne({ _id: verification._id });
            throw new ApiError(400, "Verification code has expired. Please request a new one.");
        }

        // Check attempts
        if (verification.attempts >= 5) {
            await Verification.deleteOne({ _id: verification._id });
            throw new ApiError(400, "Too many invalid attempts. Please request a new verification code.");
        }

        // Verify code
        if (verification.code !== code) {
            verification.attempts += 1;
            await verification.save();
            throw new ApiError(400, `Invalid verification code. ${5 - verification.attempts} attempts remaining.`);
        }

        // Create user
        const userData = verification.user_data;
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const user = await User.create({
            _id: userId,
            fullname: userData.fullname,
            email: userData.email,
            password_hash: userData.password,
            username: userData.username,
            provider: 'email'
        });

        // Mark verification as completed
        verification.verified = true;
        await verification.save();

        // Generate tokens
        const { generateAccessAndRefreshTokens } = await import('./user.controller.js');
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        // Get created user
        let createdUser = await User.findById(user._id).select("-password_hash -refresh_token");
        createdUser = createdUser.toObject();
        createdUser.name = createdUser.fullname;

        console.log('✅ User created and verified:', createdUser.email);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        };

        return res
            .status(201)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(new ApiResponse(201, {
                user: createdUser,
                accessToken,
                refreshToken
            }, "Email verified and account created successfully"));

    } catch (error) {
        console.error('❌ Code verification error:', error);
        throw error;
    }
});

// Resend verification code
export const resendVerificationCode = asyncHandler(async (req, res) => {
    const { email, type = 'signup' } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    try {
        // Find existing verification
        const existingVerification = await Verification.findOne({
            email: email.toLowerCase(),
            type,
            verified: false
        });

        if (!existingVerification) {
            throw new ApiError(404, "No pending verification found for this email");
        }

        // Check if too soon to resend (minimum 1 minute)
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        if (existingVerification.createdAt > oneMinuteAgo) {
            throw new ApiError(429, "Please wait at least 1 minute before requesting a new code");
        }

        // Generate new code
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Update verification
        existingVerification.code = code;
        existingVerification.expires_at = expiresAt;
        existingVerification.attempts = 0;
        await existingVerification.save();

        // Send email based on type
        if (type === 'signup') {
            const userData = existingVerification.user_data;
            await sendVerificationEmail(email, code, userData.fullname);
        } else if (type === 'password_reset') {
            await sendPasswordResetEmail(email, code);
        }

        console.log('✅ Verification code resent:', email);

        return res.status(200).json(
            new ApiResponse(200, {
                message: "New verification code sent to your email",
                expires_in: 600
            }, "Verification code resent successfully")
        );

    } catch (error) {
        console.error('❌ Resend verification error:', error);
        throw error;
    }
});

// Send password reset verification
export const sendPasswordResetVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        // Don't reveal if email exists or not for security
        return res.status(200).json(
            new ApiResponse(200, {
                message: "If this email is registered, you will receive a password reset code"
            }, "Password reset initiated")
        );
    }

    try {
        // Delete any existing password reset verification
        await Verification.deleteMany({ email: email.toLowerCase(), type: 'password_reset' });

        // Generate OTP
        const code = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store verification
        await Verification.create({
            email: email.toLowerCase(),
            code,
            type: 'password_reset',
            expires_at: expiresAt
        });

        // Send email
        await sendPasswordResetEmail(email, code, user.fullname);

        console.log('✅ Password reset email sent:', email);

        return res.status(200).json(
            new ApiResponse(200, {
                message: "Password reset code sent to your email",
                expires_in: 600
            }, "Password reset code sent successfully")
        );

    } catch (error) {
        console.error('❌ Password reset error:', error);
        throw new ApiError(500, "Failed to send password reset code");
    }
});

// Verify password reset code
export const verifyPasswordResetCode = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        throw new ApiError(400, "Email and verification code are required");
    }

    try {
        const verification = await Verification.findOne({
            email: email.toLowerCase(),
            type: 'password_reset',
            verified: false
        });

        if (!verification) {
            throw new ApiError(404, "Invalid or expired verification code");
        }

        if (verification.expires_at < new Date()) {
            await Verification.deleteOne({ _id: verification._id });
            throw new ApiError(400, "Verification code has expired");
        }

        if (verification.attempts >= 5) {
            await Verification.deleteOne({ _id: verification._id });
            throw new ApiError(400, "Too many invalid attempts");
        }

        if (verification.code !== code) {
            verification.attempts += 1;
            await verification.save();
            throw new ApiError(400, `Invalid verification code. ${5 - verification.attempts} attempts remaining.`);
        }

        // Mark as verified but don't delete yet (needed for password reset)
        verification.verified = true;
        await verification.save();

        return res.status(200).json(
            new ApiResponse(200, {
                message: "Verification code confirmed",
                verified: true
            }, "Code verified successfully")
        );

    } catch (error) {
        console.error('❌ Password reset verification error:', error);
        throw error;
    }
});

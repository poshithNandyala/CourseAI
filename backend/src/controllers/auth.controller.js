import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { cookieOptions } from '../utils/httpConfig.js';

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

export const googleAuth = asyncHandler(async (req, res) => {
  // This will be called by passport.authenticate()
  res.redirect('/api/v1/auth/google');
});

export const googleCallback = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/signin?error=authentication_failed`);
    }

    console.log('✅ Google OAuth user:', user.email);

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Get user data for frontend (matching email login pattern)
    let loggedInUser = await User.findById(user._id).select("-password_hash -refresh_token");
    
    // Add 'name' field for frontend compatibility
    loggedInUser = loggedInUser.toObject();
    loggedInUser.name = loggedInUser.fullname;

    // Set cookies
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Redirect to frontend with success
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?auth=success`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/signin?error=server_error`);
  }
});

export const githubAuth = asyncHandler(async (req, res) => {
  // This will be called by passport.authenticate()
  res.redirect('/api/v1/auth/github');
});

export const githubCallback = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/signin?error=authentication_failed`);
    }

    console.log('✅ GitHub OAuth user:', user.email);

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Get user data for frontend (matching email login pattern)
    let loggedInUser = await User.findById(user._id).select("-password_hash -refresh_token");
    
    // Add 'name' field for frontend compatibility
    loggedInUser = loggedInUser.toObject();
    loggedInUser.name = loggedInUser.fullname;

    // Set cookies
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Redirect to frontend with success
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?auth=success`);
  } catch (error) {
    console.error('GitHub callback error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/signin?error=server_error`);
  }
});

export const getAuthStatus = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { authenticated: !!req.user }, 'Auth status retrieved')
  );
});

export const getOAuthUser = asyncHandler(async (req, res) => {
  try {
    if (req.user) {
      const currentUser = req.user.toObject ? req.user.toObject() : { ...req.user };
      currentUser.name = currentUser.fullname;

      return res.status(200).json(
        new ApiResponse(200, {
          user: currentUser,
          accessToken: req.cookies?.accessToken || null
        }, 'OAuth user data retrieved')
      );
    }

    if (req.session.oauthUser) {
      const userData = req.session.oauthUser;
      // Clear the session data after retrieval
      delete req.session.oauthUser;
      
      return res.status(200).json(
        new ApiResponse(200, userData, 'OAuth user data retrieved')
      );
    }
    
    return res.status(404).json(
      new ApiResponse(404, null, 'No OAuth user data found')
    );
  } catch (error) {
    console.error('Get OAuth user error:', error);
    return res.status(500).json(
      new ApiResponse(500, null, 'Error retrieving OAuth user data')
    );
  }
});

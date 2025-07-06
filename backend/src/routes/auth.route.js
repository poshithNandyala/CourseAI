import { Router } from 'express';
import passport from '../config/passport.js';
import {
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
  getAuthStatus,
  getOAuthUser
} from '../controllers/auth.controller.js';
import { OptionalVerifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin?error=google_auth_failed' }),
  googleCallback
);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/signin?error=github_auth_failed' }),
  githubCallback
);

// Auth status route
router.get('/status', OptionalVerifyJWT, getAuthStatus);

// OAuth user data route
router.get('/oauth-user', getOAuthUser);

export default router;

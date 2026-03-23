import { Router } from 'express';
import passport from '../config/passport.js';
import {
  googleCallback,
  githubCallback,
  getAuthStatus,
  getOAuthUser
} from '../controllers/auth.controller.js';
import { OptionalVerifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();
const frontendBaseUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${frontendBaseUrl}/signin?error=google_auth_failed`,
    session: false
  }),
  googleCallback
);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: `${frontendBaseUrl}/signin?error=github_auth_failed`,
    session: false
  }),
  githubCallback
);

// Auth status route
router.get('/status', OptionalVerifyJWT, getAuthStatus);

// OAuth user data route
router.get('/oauth-user', OptionalVerifyJWT, getOAuthUser);

export default router;

import { Router } from 'express';
import {
    sendSignupVerification,
    verifySignupCode,
    resendVerificationCode,
    sendPasswordResetVerification,
    verifyPasswordResetCode
} from '../controllers/verification.controller.js';

const router = Router();

// Signup verification routes
router.post('/send-signup-verification', sendSignupVerification);
router.post('/verify-signup', verifySignupCode);

// Password reset verification routes
router.post('/send-password-reset', sendPasswordResetVerification);
router.post('/verify-password-reset', verifyPasswordResetCode);

// General resend route
router.post('/resend-code', resendVerificationCode);

export default router;

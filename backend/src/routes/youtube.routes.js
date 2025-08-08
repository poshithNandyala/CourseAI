import { Router } from 'express';
import {
  searchVideos,
  searchEducationalVideos
} from '../controllers/youtube.controller.js';
import { VerifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All YouTube endpoints require authentication since they use user's API keys
router.use(VerifyJWT);

// YouTube API endpoints
router.post('/search', searchVideos);
router.post('/search-educational', searchEducationalVideos);

export default router;

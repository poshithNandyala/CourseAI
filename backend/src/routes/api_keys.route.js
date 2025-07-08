import { Router } from "express";
import {
    getApiKeysStatus,
    updateApiKeys,
    getDecryptedApiKeys,
    deleteApiKeys
} from "../controllers/api_keys.controller.js";
import { VerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(VerifyJWT);

// Get API keys status
router.route("/status").get(getApiKeysStatus);

// Update API keys
router.route("/update").post(updateApiKeys);

// Get decrypted API keys (for internal use)
router.route("/keys").get(getDecryptedApiKeys);

// Delete API keys
router.route("/delete").delete(deleteApiKeys);

export default router;

import { Router } from "express";
import verifyUser from "../middlewares/auth.middleware.js";
import { profileLimiter } from "../middlewares/rateLimit.middleware.js";
import getMe from "../controllers/profile/profile.controller.js";

const router = Router()

router.get("/me", verifyUser, profileLimiter, getMe);

export default router;
import { Router } from "express";
import signUp from "../controllers/auth/signup/signup.controller.js";
import login from "../controllers/auth/login/login.controller.js";
import logout from "../controllers/auth/logout/logout.controller.js";
import sendOtp from "../controllers/auth/forgotPassword/sendOtp.controller.js";
import verifyOtp from "../controllers/auth/forgotPassword/verifyOtp.controller.js";
import changePassword from "../controllers/auth/forgotPassword/changePassword.controller.js";
import { authLimiter, loginLimiter, logoutLimiter, sendOtpLimiter, verifyOtpLimiter } from "../middlewares/rateLimit.middleware.js";
import refreshAccessToken from "../controllers/auth/refresh/refresh.controller.js";

const router = Router();

router.post("/signup", authLimiter, signUp);
router.post("/login", loginLimiter, login);
router.post("/refresh", authLimiter, refreshAccessToken);
router.post("/logout", logoutLimiter, logout);

//forget password routes
router.post("/forgot-password/sendotp", sendOtpLimiter, sendOtp);
router.post("/forgot-password/verify-otp", verifyOtpLimiter, verifyOtp);
router.put("/forgot-password/changepassword", authLimiter, changePassword);

export default router;
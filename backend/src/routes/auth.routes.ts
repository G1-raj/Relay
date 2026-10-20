import { Router } from "express";
import signUp from "../controllers/auth/signup/signup.controller.js";
import login from "../controllers/auth/login/login.controller.js";
import logout from "../controllers/auth/logout/logout.controller.js";
import sendOtp from "../controllers/auth/forgotPassword/sendOtp.controller.js";
import verifyOtp from "../controllers/auth/forgotPassword/verifyOtp.controller.js";
import changePassword from "../controllers/auth/forgotPassword/changePassword.controller.js";

const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/logout", logout);

//forget password routes
router.post("/forgot-password/sendotp", sendOtp);
router.post("/forgot-password/verify-otp", verifyOtp);
router.put("/forgot-password/changepassword", changePassword);

export default router;
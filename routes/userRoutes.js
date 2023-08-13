import {Router} from "express";
import { register,login,logout,getProfile } from "../controllers/userController.js";

import { isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = Router()

router.post('/register',upload.single("avatar"),register)
router.post('/login',login)
router.get('/logout',logout)
router.get('/me',isLoggedIn,getProfile)
router.post('/forgot-password',forgotPassword)
router.post('/reset-password',resetPassword)

export default router
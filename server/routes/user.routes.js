import { Router } from "express";
import { forgotPasswordController, loginController, logoutController, refreshTokenController, registerUserController, resetPasswordController, updateUserDetails, uploadUserAvatar, userDetails, verifyEmailController, verifyforgotPasswordOTPController } from "../controllers/user.controllers.js";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

const userRouter = Router();

userRouter.post('/register', registerUserController);
userRouter.post('/verify-email', verifyEmailController);
userRouter.post('/login', loginController);
userRouter.get('/logout',auth,logoutController);
userRouter.put('/upload-avatar',auth,upload.single('avatar'), uploadUserAvatar);
userRouter.put('/update-user',auth, updateUserDetails);
userRouter.put('/forgot-password', forgotPasswordController);
userRouter.put('/verify-forgot-password-otp', verifyforgotPasswordOTPController);
userRouter.put('/reset-password', resetPasswordController);
userRouter.post('/refresh-token',refreshTokenController);
userRouter.get('/user-details',auth, userDetails);

export default userRouter;
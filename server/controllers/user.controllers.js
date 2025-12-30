import sendEmail from "../config/sendEmail.js";
import UserModel from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import forgotPasswordEmailTemplate from "../utils/forgotPasswordEmailTemplate.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import uploadImageCloudinary from "../utils/uploadImageCloudinary.js";
import generateOTP from "../utils/generateOTP.js";
import jwt from "jsonwebtoken";

export async function registerUserController(req, res) {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please provide name, email and password",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({ email });

        if (user) {
            return res.status(400).json({
                message: "Email already registered",
                error: true,
                success: false
            });
        }
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        const payload = {
            name,
            email,
            password: hashPassword
        }

        const newUser = new UserModel(payload);
        const save = await newUser.save();
        const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`;
        
        try {
            const verificationEmail = await sendEmail({
                sendTo: email,
                subject: "Verify Your Email Address - TerraTrack",
                html: verifyEmailTemplate(
                    {
                        name,
                        url: verifyEmailUrl
                    }
                )
            });
            console.log('Verification email sent to:', email);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails, but log it
            // User can still verify manually or resend later
        }

        return res.json({
            message: "User Registered Successfully. Please check your email for verification.",
            success: true,
            error: false,
            data: save
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export async function verifyEmailController(req, res) {
    try {
        const { code } = req.body;

        const user = await UserModel.findOne({ _id: code });

        if (!user) {
            return res.status(400).json({
                message: "Invalid Code",
                success: false,
                error: true
            });
        }

        const updateUser = await UserModel.updateOne({ _id: code }, { verify_email: true });

        return res.json({
            message: "Email successfully verified",
            success: true,
            error: false
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            succes: false
        });
    }
}

export async function loginController(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Provide email and password",
                success: false,
                error: true
            });
        }
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User does not exist. Please register user",
                success: false,
                error: true
            });
        }

        if (user.status !== "Active") {
            return res.status(400).json({
                message: "Account is not Active. Contact Admin",
                success: false,
                error: true
            });
        }

        const checkPassword = await bcryptjs.compare(password, user.password);

        if (!checkPassword) {
            return res.status(400).json({
                message: "Incorrect Password",
                success: false,
                error: true
            });
        }

        const accessToken = await generateAccessToken(user._id);
        const refreshToken = await generateRefreshToken(user._id);

        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            last_login_date : new Date().toISOString()
        });
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        res.cookie('accessToken', accessToken, cookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);

        return res.json({
            message: "Login successful",
            success: true,
            error: false,
            data: {
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}

export async function logoutController(req, res) {
    try {
        const userId = req.userId; // middleware
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userId, {
            refresh_token: ""
        });

        return res.json({
            message: "Logout successful",
            success: true,
            error: false
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}

export async function uploadUserAvatar(req, res) {
    try {
        const userId = req.userId; //auth middleware
        const image = req.file; //multer middleware
        const upload = await uploadImageCloudinary(image);

        const updateUser = await UserModel.findByIdAndUpdate(userId, { avatar: upload.url });

        return res.json({
            message: "Uploaded User Avatar",
            success : true,
            error : false,
            data: {
                _id: userId,
                avatar: upload.url,
            }
        });
    } catch (error) {
        return res.status(400).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}

export async function updateUserDetails(req, res) {
    try {
        const userId = req.userId;
        const { name, mobile, email, password } = req.body;

        let hashPassword = "";
        if (password) {
            const salt = await bcryptjs.genSalt(10);
            hashPassword = await bcryptjs.hash(password, salt);
        }

        const update = await UserModel.updateOne({ _id: userId }, {
            ...(name && { name: name }),
            ...(mobile && { mobile: mobile }),
            ...(email && { email: email }),
            ...(password && { password: hashPassword })
        });

        return res.json({
            message: "User updated successfully",
            success: true,
            error: false,
            data: update
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}

export async function forgotPasswordController(req, res) {
    try {
        const { email } = req.body;
        if(!email){
            return res.status(400).json({
                message: "Please provide email",
                success: false,
                error: true
            });
        }
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User with this email does not exist",
                success: false,
                error: true
            });
        }
        const otp = generateOTP();
        const expireTime = new Date() + 60 * 60 * 1000; //1hr

        const update = await UserModel.findByIdAndUpdate(user._id, {
            forgot_password_otp: otp,
            forgot_password_expiry: new Date(expireTime).toISOString()
        });
        try {
            await sendEmail({
                sendTo: email,
                subject: "Password Reset Code - TerraTrack",
                html: forgotPasswordEmailTemplate(user.name, otp)
            });
            console.log('Password reset email sent to:', email);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            return res.status(500).json({
                message: "Failed to send reset email. Please try again.",
                success: false,
                error: true
            });
        }
        return res.json({
            message: "Check your email",
            success: true,
            error: false
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}

export async function verifyforgotPasswordOTPController(req, res){
    try {
        const {email, otp} = req.body;

        if(!email || !otp){
            return res.status(400).json({
                message : "Please provide email and otp",
                success : false,
                error : true
            });
        }
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "User with this email does not exist",
                success: false,
                error: true
            });
        }

        const currentTime = new Date().toISOString();

        if(user.forgot_password_expiry < currentTime){
            return res.status(400).json({
                message : "OTP is expired",
                success : false,
                error : true
            });
        }

        if(otp !== user.forgot_password_otp){
            return res.status(400).json({
                message : "Invalid OTP",
                success : false,
                error : true
            });
        }

        const updateUser = UserModel.findByIdAndUpdate(user?._id, {
            forgot_password_otp : "",
            forgot_password_expiry : ""
        });
        
        return res.json({
            message : "OTP verified successfully",
            success : true,
            error : false
        });

    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            success : false,
            error : true
        });
    }
}

export async function resetPasswordController(req, res){
    try {
        const {email, newPassword, confirmPassword} = req.body;
        if(!email || !newPassword || !confirmPassword){
            return res.status(400).json({
                message : "Please provide email, newPassword and confirmPassword",
                success : false,
                error : true
            });
        }

        const user = await UserModel.findOne({email});

        if(!user){
            return res.status(400).json({
                message : "User does not exist",
                success : false,
                error : true
            });
        }

        if(confirmPassword !== newPassword){
            return res.status(400).json({
                message : "newPassword and confirmPassword do not match",
                success : false,
                error : true
            });
        }
        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(newPassword, salt);

        const update = await UserModel.findOneAndUpdate(user._id,{
            password : hashPassword
        });

        return res.json({
            message : "Password updated successfully",
            success : true,
            error : false
        });
    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            success : false,
            error : true
        });
    }
}

export async function refreshTokenController(req, res){
    try {
        const authHeader = req?.headers?.authorization;
        const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

        const refreshToken = req?.cookies?.refreshToken || tokenFromHeader;

        if(!refreshToken){
            return res.status(401).json({
                message : "Invalid Token",
                success : true,
                error : false
            });
        }
        console.log("Token ", refreshToken);

        const verifyToken = await jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);

        if(!verifyToken){
            return res.status(401).json({
                message : "Token is expired",
                success : false,
                error : true
            });
        }

        const userId = verifyToken?.id;
        const newAccessToken = await generateAccessToken(userId);

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        res.cookie('accessToken', newAccessToken, cookieOptions);

        return res.json({
            message : "New Access Token Generated",
            success : true,
            error : false,
            data : {
                accessToken : newAccessToken
            }
        });

    } catch (error) {
        return res.status(500).json({
            message : error.message || error,
            success : false,
            error : true
        });
    }
}

// Get logged in user details
export async function userDetails(req,res){
    try {
        const userId = req.userId

        const user = await UserModel.findById(userId).select('-password -refresh_token')

        return res.json({
            message : "User details",
            data : user,
            success : true,
            error : false
        })
    } catch (error) {
        res.status(500).json({
            message : "Something is wrong",
            success : false,
            error : true
        });
    }
}
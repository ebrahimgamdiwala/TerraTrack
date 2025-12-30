import UserModel from '../models/user.model.js';
export const admin = async (req, res, next) => {
    try {
        const userId = req.userId;
        
        const user = await UserModel.findById(userId);
        if(user && user.role === 'ADMIN') {
            req.user = user; // Set the user object for the controller
            next();
        } else {
            return res.status(403).json({
                success: false,
                error: true,
                message: "Permission Denied"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: true,
            message: "Permission Denied"
        });
    }
}
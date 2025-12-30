import jwt from "jsonwebtoken";

const auth = (req, res, next)=>{
    try {
        const authHeader = req?.headers?.authorization;
        const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

        const token = req?.cookies?.accessToken || tokenFromHeader;

        if(!token){
            return res.status(401).json({
                message : "Provide Token",
                success : false,
                error : true
            });
        }
        const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

        if(!decode){
            return res.status(401).json({
                message : "Unauthorized Access"
            });
        }

        req.userId = decode.id;

        next();
    } catch (error) {
        return res.status(500).json({
            message : "Please Login" || error,
            success : false,
            error : true
        });
    }
}

export default auth;
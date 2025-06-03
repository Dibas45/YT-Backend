import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJwt= asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        throw new ApiError(401, "Access token is required");
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          
       const user= await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        req.user = user; // Attach the user to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired access token" });
    }   
});
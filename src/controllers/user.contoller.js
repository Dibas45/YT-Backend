import {asyncHandler} from './../utils/asyncHandler.js'
import {ApiError} from './../utils/apiError.js'
import {ApiResponse} from './../utils/apiResponse.js'
import {User} from "../models/user.model.js "
import {uploadOnCloudinary} from "../utils/cloudaniry.js";

export const registerUser= asyncHandler(async (req, res) => {
   //1)get user data from frontend
    const {fullName, email,username, password} = req.body;
   //2)validation -not empty
    if (!fullName || !email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }
   //3)check if user already exists:by username or email
   const existedUser= await User.findOne({$or: [{email}, {username}]})
    if (existedUser) {
        throw new ApiError(409, "User already exists with this email or username");
    }
   //4)check for images,check for avatar
    const avatarLocalPath=req.files?.avatar[0]?.path;
   const coverImageLocalPath= req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
          throw new ApiError(400, "Avatar is required");
     }
   //5)upload them in to cloudaninary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath); 
    if (!avatar) {
        throw new ApiError(400, "Avatar is required");
    }
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

   //6)create user object--create entry in database
    const user = await User.create({
        fullName,
        email,
        username:username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage ?.url||""
    });
   //7)remove password and refresh token from user object
   //8)check for user creation
   const createdUser=await User.findById(user._id).select(
         "-password -refreshToken"
   )
    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }
    
   //9)send response to frontend
   return res.status(201).json(
        new ApiResponse(201, "User created successfully", createdUser)
    );
   
}
);



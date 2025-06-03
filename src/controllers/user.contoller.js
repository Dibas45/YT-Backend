import {asyncHandler} from './../utils/asyncHandler.js'
import {ApiError} from './../utils/apiError.js'
import {ApiResponse} from './../utils/apiResponse.js'
import {User} from "../models/user.model.js "
import {uploadOnCloudinary} from "../utils/cloudaniry.js"
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user= await User.findById(userId)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;   
        await user.save({
            validateBeforeSave: false // Skip validation for refreshToken
        });
        return {
            accessToken,
            refreshToken
        };
        
    } catch (error) {
        throw new ApiError(500, "Error generating tokens");
        
    }
}

export const registerUser= asyncHandler(async (req, res) => {
   //1)get user data from frontend
    const {fullName, email,username, password} = req.body;
   //2)validation -not empty
    if (!fullName || !email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }
   //3)check if user already exists:by username or email
   const existedUser=await User.findOne({$or: [{email}, {username}]})
    if (existedUser) {
        throw new ApiError(409, "User already exists with this email or username");
    }
   //4)check for images,check for avatar
    const avatarLocalPath=req.files?.avatar[0]?.path;
//    const coverImageLocalPath= req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }
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

export const loginUser=asyncHandler(async(req,res)=>{
    const {email, password} = req.body;
    //1)validation
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    //2)check for user
    const user = await User.findOne({email});
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    //3)check for password
    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) {
        throw new ApiError(401, "Invalid email or password");
    }
    //4)generate refresh token and access token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
   
    const loggedInUser= await User.findById(user._id).select(
        "-password -refreshToken"
    );
    //5)send cookies
    const options = {
        httpOnly: true,
        secure:true,
    };
    return res.status(200).cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,{
            message: "User logged in successfully",
            user: loggedInUser,
            accessToken,
            refreshToken
 }));
});

export const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $set: {
            refreshToken: undefined
        }
    },{
        new:true
    } )
    const options = {
        httpOnly: true,
        secure:true,
       
    };
    return res.status(200).clearCookie("accessToken",  options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully"));

});

export const refreshAccessToken=asyncHandler(async(req,res)=>{
   const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken;
    if (!incomingRefreshToken) {
          throw new ApiError(401, "Refresh token is required");
     }
    try {
        //1)verify refresh token
       const decodedToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!decodedToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
        //2)check for user
        const user = await User.findById(decodedToken?._id);
        if (!user ) {
            throw new ApiError(401, "Invalid refresh token");
        }
        //3)check if refresh token matches
        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
            const options = {
                httpOnly: true,
                secure:true,
            };
            
          const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
            
            return res.status(200).cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(new ApiResponse(200, "Tokens refreshed successfully", {
                    accessToken,
                    newRefreshToken
                }));
    } catch (error) {
        throw new ApiError(500, "Error refreshing access token");
        
    }

    
});

export const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const{oldPassword,newPassword}=req.body;
   const user= await User.findById(req.user?.id)
 const isPasswordCorrect= await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Old password is incorrect");
    }
    user.password=newPassword;
    await user.save({
        validateBeforeSave: false
    });
    return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
})

export const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully"));
});
    
export const updateAccountDetails=asyncHandler(async(req,res)=>{   
    const {fullName, email} = req.body;
    //1)validation
    if (!fullName|| !email) {
        throw new ApiError(400, "All fields are required");
    }
    //2)check for user
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true, // Return the updated user
    }
).select("-password ");
    
    return res.status(200).json(new ApiResponse(200,user, "Account details updated successfully")); 
});

export const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }
    //1)upload avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Avatar upload failed");
    }
    //2)update user avatar in database
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true, // Return the updated user
        }
    ).select("-password ");
    
    return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
})

export const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image is required");
    }
    //1)upload avatar to cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "cover image upload failed");
    }
    //2)update user avatar in database
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true, // Return the updated user
        }
    ).select("-password ");
    
    return res.status(200).json(new ApiResponse(200, user, "coverImage updated successfully"));
})
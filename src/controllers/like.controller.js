import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const userId = req.user._id
    const existingLike = await Like.findOne({ videoId, userId })
    if (existingLike) {
        // Unlike the video
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, "Video unliked successfully"))
    } else {
        // Like the video
        const newLike = new Like({
            videoId,
            userId,
            createdAt: new Date()
        })
        await newLike.save()
        return res.status(201).json(new ApiResponse(201, "Video liked successfully", newLike))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    const userId = req.user._id
    const existingLike = await Like.findOne({ commentId, userId })
    if (existingLike) {
        // Unlike the comment
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, "Comment unliked successfully"))
    } else {
        // Like the comment
        const newLike = new Like({
            commentId,
            userId,
            createdAt: new Date()
        })
        await newLike.save()
        return res.status(201).json(new ApiResponse(201, "Comment liked successfully", newLike))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId=req.user._id

    if(!tweetId){
        throw new ApiError(400,"Tweet id is missing")
    }

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400,"Tweet id is invalid")
    }

    const alreadyLiked= await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    if(alreadyLiked){
        await Like.findByIdAndDelete(alreadyLiked._id)
        return res.
        status(200)
        .json(
            new ApiResponse(200,null,"Unliked tweet successfully")
        )
    }
    else{
        const newLike = await Like.create(
            {
                tweet:tweetId,
                likedBy:userId
            }
        )
        return res.
        status(200)
        .json(
            new ApiResponse(200,newLike,"Liked tweet successfully")
        )
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id
    const likedVideos = await Like.find({ userId, videoId: { $exists: true } })
        .populate('videoId', 'title thumbnail')
        .sort({ createdAt: -1 })
    if (likedVideos.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No liked videos found", []))
    }
    res.status(200).json(new ApiResponse(200, "Liked videos fetched successfully", likedVideos))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
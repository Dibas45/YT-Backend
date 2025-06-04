import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.params
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const channelVideos = await Video.find({ userId: channelId })
    if (!channelVideos || channelVideos.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No videos found for this channel", {}))
    }
    const totalViews = channelVideos.reduce((acc, video) => acc + video.views, 0)
    const totalSubscribers = await Subscription.countDocuments({ channelId })
    const totalVideos = channelVideos.length
    const totalLikes = await Like.countDocuments({ videoId: { $in: channelVideos.map(video => video._id) } })
    const channelStats = {
        totalViews,
        totalSubscribers,
        totalVideos,
        totalLikes
    }
    res.status(200).json(new ApiResponse(200, "Channel stats fetched successfully", channelStats))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const channelVideos = await Video.find({ userId: channelId }).sort({ createdAt: -1 })
    if (!channelVideos || channelVideos.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No videos found for this channel", []))
    }
    res.status(200).json(new ApiResponse(200, "Channel videos fetched successfully", channelVideos))
    
})

export {
    getChannelStats, 
    getChannelVideos
    }
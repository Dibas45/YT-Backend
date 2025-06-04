import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const skip = (page - 1) * limit
    const filter = {}
    if (query) {
        filter.title = { $regex: query, $options: "i" } // case-insensitive search
    }
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        filter.userId = userId
    }
    const sort = {}
    if (sortBy) {
        sort[sortBy] = sortType === "desc" ? -1 : 1 // default to ascending order
    } else {
        sort.createdAt = -1 // default to latest first
    }
    const videos = await Video.find(filter)
        .populate("userId", "name email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
    if (!videos || videos.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No videos found", []))
    }
    const totalVideos = await Video
.countDocuments(filter)
    res.status(200).json(new ApiResponse(200, "Videos fetched successfully", {
        videos,
        totalVideos,
        currentPage: page,
        totalPages: Math.ceil(totalVideos / limit)
    }))
    
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to publish this video")
    }
    if (!video.isPublished) {
        throw new ApiError(400, "Video is not ready to be published")
    }
    video.title = title
    video.description = description
    if (req.file) {
        const uploadResult = await uploadOnCloudinary(req.file.path, "videos")
        video.thumbnail = uploadResult.secure_url
    }
    video.isPublished = true
    await video.save()
    res.status(200).json(new ApiResponse(200, "Video published successfully", video))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId).populate("userId", "name email")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    res.status(200).json(new ApiResponse(200, "Video fetched successfully", video))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video")
    }
    const { title, description } = req.body
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }
    video.title = title
    video.description = description
    if (req.file) {
        const uploadResult = await uploadOnCloudinary(req.file.path, "videos")
        video.thumbnail = uploadResult.secure_url
    }
    await video.save()
    res.status(200).json(new ApiResponse(200, "Video updated successfully", video))


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video")
    }
    await Video.findByIdAndDelete(videoId)
    res.status(200).json(new ApiResponse(200, "Video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to toggle publish status of this video")
    }
    video.isPublished = !video.isPublished
    await video.save()  
    res.status(200).json(new ApiResponse(200, "Video publish status toggled successfully", video))


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
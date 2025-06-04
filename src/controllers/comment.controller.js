import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const skip = (page - 1) * limit
    const comments = await Comment.find({videoId})
        .populate("userId", "name email")
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)
    if (!comments || comments.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No comments found for this video", []))
    }
    const totalComments = await Comment.countDocuments({videoId})
    res.status(200).json(new ApiResponse(200, "Comments fetched successfully", {
        comments,
        totalComments,
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit)
    }))


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required")
    }
    const newComment = new Comment({
        videoId,
        userId: req.user._id,
        content,
        createdAt: new Date(),
        updatedAt: new Date()
    })
    await newComment.save()
    res.status(201).json(new ApiResponse(201, "Comment added successfully", newComment))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }
    comment.content = content
    comment.updatedAt = new Date()
    await comment.save()
    res.status(200).json(new ApiResponse(200, "Comment updated successfully", comment))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }
    await comment.remove()
    res.status(200).json(new ApiResponse(200, "Comment deleted successfully"))
    
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
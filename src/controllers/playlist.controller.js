import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required")
    }
    const newPlaylist = new Playlist({
        name,
        description,
        userId: req.user._id,
        createdAt: new Date(),
        updatedAt: new Date()
    })
    await newPlaylist.save()
    res.status(201).json(new ApiResponse(201, "Playlist created successfully", newPlaylist))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    const playlists = await Playlist.find({userId}).sort({createdAt: -1})
    if (playlists.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No playlists found for this user", []))
    }
    res.status(200).json(new ApiResponse(200, "Playlists fetched successfully", playlists))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    const playlist = await Playlist.findById(playlistId).populate("userId", "name email")
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    res.status(200).json(new ApiResponse(200, "Playlist fetched successfully", playlist))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
 const {playlistId, videoId} = req.params
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is missing");
    }

    // const videoLocalPath=req.files?.video[0].path
    // if(!videoLocalPath){
    //     throw new ApiError(400,'Video file is required on local server')
    // }
    // const video=await uploadOnCloudinary(videoLocalPath)

    if(!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid Playlist ID");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found with given playlist id");
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video with given video id does not exist");
    }

    if (playlist.video.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist");
    }

    playlist.video.push(videoId)
    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );    



})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    if (playlist.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to remove videos from this playlist")
    }
    const videoIndex = playlist.videos.indexOf(videoId)
    if (videoIndex === -1) {
        throw new ApiError(404, "Video not found in this playlist")
    }
    playlist.videos.splice(videoIndex, 1)
    playlist.updatedAt = new Date()
    await playlist.save()
    res.status(200).json(new ApiResponse(200, "Video removed from playlist successfully", playlist))


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    if (playlist.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }
    await playlist.remove()
    res.status(200).json(new ApiResponse(200, "Playlist deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required")
    }
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    if (playlist.userId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist")
    }
    playlist.name = name.trim()
    playlist.description = description ? description.trim() : playlist.description
    playlist.updatedAt = new Date()
    await playlist.save()
    res.status(200).json(new ApiResponse(200, "Playlist updated successfully", playlist))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
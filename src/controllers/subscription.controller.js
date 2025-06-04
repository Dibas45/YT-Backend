import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    const userId = req.user._id
    const existingSubscription = await Subscription.findOne({ channelId, subscriberId: userId })
    if (existingSubscription) {
        // Unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(new ApiResponse(200, "Unsubscribed successfully"))
    } else {
        // Subscribe
        const newSubscription = new Subscription({
            channelId,
            subscriberId: userId,
            createdAt: new Date()
        })
        await newSubscription.save()
        return res.status(201).json(new ApiResponse(201, "Subscribed successfully", newSubscription))
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    const subscribers = await Subscription.find({ channelId: channelId })
    .populate('subscriberId', 'username profilePicture')
    .sort({ createdAt: -1 })
    if (subscribers.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No subscribers found for this channel", []))
    }
    res.status(200).json(new ApiResponse(200, "Subscribers fetched successfully", subscribers))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }
    const user = await User.findById(subscriberId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    const subscriptions = await Subscription.find({ subscriberId: subscriberId })
        .populate('channelId', 'username profilePicture')
        .sort({ createdAt: -1 })
    if (subscriptions.length === 0) {
        return res.status(200).json(new ApiResponse(200, "No subscribed channels found for this user", []))
    }
    res.status(200).json(new ApiResponse(200, "Subscribed channels fetched successfully", subscriptions))
    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
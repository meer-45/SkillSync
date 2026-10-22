import { User } from "../models/user.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import UserSkill from "../models/userSkill.models.js";
import Wallet from "../models/wallet.models.js";
import Progress from "../models/progress.models.js";
import { UserBadge } from "../models/userBadge.models.js";
import Notification from "../models/notification.models.js";
import Request from "../models/request.models.js";
import Feedback from "../models/feedback.models.js";
import Session from "../models/session.models.js";

export const getAllUsersController = asyncHandler(async (_req, res) => {
  const users = await User.find({}).select("-passwordHash -refreshTokenHash");
  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const getUserByIdController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-passwordHash -refreshTokenHash",
  );
  if (!user) throw new ApiError(404, "User not found");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

export const updateUserController = asyncHandler(async (req, res) => {
  const { fullName, bio, age } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: { fullName, bio, age } },
    { new: true },
  ).select("-passwordHash -refreshTokenHash");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

export const deleteUserController = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

export const searchUsersController = asyncHandler(async (req, res) => {
  const query = typeof req.query.q === "string"
    ? req.query.q.trim().slice(0, 50)
    : "";
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({
    _id: { $ne: req.user!._id },
    $or: [
      { fullName: { $regex: escapedQuery, $options: "i" } },
      { username: { $regex: escapedQuery, $options: "i" } },
    ],
  }).select("_id fullName username avatar").limit(20);
  return res.status(200).json(new ApiResponse(200, users, "Users found"));
});

export const deleteCurrentUserController = asyncHandler(async (req, res) => {
  const userId = req.user!._id;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await UserSkill.deleteMany({ userId }).session(session);
      await Wallet.deleteOne({ userId }).session(session);
      await Progress.deleteOne({ userId }).session(session);
      await UserBadge.deleteMany({ user: userId }).session(session);
      await Notification.deleteMany({ userId }).session(session);
      await Request.deleteMany({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      }).session(session);
      await Feedback.deleteMany({
        $or: [{ fromUser: userId }, { toUser: userId }],
      }).session(session);
      await Session.updateMany(
        { $or: [{ teacherId: userId }, { learnerId: userId }], status: "scheduled" },
        { $set: { status: "cancelled" } },
        { session },
      );
      await User.deleteOne({ _id: userId }).session(session);
    });
  } finally {
    await session.endSession();
  }
  return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

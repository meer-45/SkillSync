import mongoose from "mongoose";
import Message from "../models/chat.models.js";
import asyncHandler from "../utils/asyncHandler.js";

type UserId = string | mongoose.Types.ObjectId;

export const getRoomId = (userA: UserId, userB: UserId): string =>
  [userA.toString(), userB.toString()].sort().join("_");

export const getChatHistory = asyncHandler(async (req, res) => {
  const roomId = getRoomId(req.user!._id, String(req.params.userId));
  const messages = await Message.find({ roomId })
    .populate("sender", "fullName username avatar")
    .sort({ createdAt: 1 })
    .limit(100);

  await Message.updateMany(
    { roomId, sender: { $ne: req.user!._id }, isRead: false },
    { $set: { isRead: true } },
  );

  return res.json({ success: true, data: messages });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    sender: { $ne: req.user!._id },
    isRead: false,
    roomId: { $regex: req.user!._id.toString() },
  });
  return res.json({ success: true, data: { count } });
});

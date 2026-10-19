import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  getNotificationsService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
} from "../services/notification.service.js";

export const getNotificationsController = asyncHandler(async (req, res) => {
  const result = await getNotificationsService(req.user!._id);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notifications fetched"));
});

export const markAsReadController = asyncHandler(async (req, res) => {
  await markAsReadService(String(req.params.id), req.user!._id);
  return res.status(200).json(new ApiResponse(200, {}, "Marked as read"));
});

export const markAllAsReadController = asyncHandler(async (req, res) => {
  await markAllAsReadService(req.user!._id);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All marked as read"));
});

export const deleteNotificationController = asyncHandler(async (req, res) => {
  await deleteNotificationService(String(req.params.id), req.user!._id);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification deleted"));
});

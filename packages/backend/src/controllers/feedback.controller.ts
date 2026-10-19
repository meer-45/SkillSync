import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  createFeedbackService,
  getFeedbackForUserService,
  deleteFeedbackService,
} from "../services/feedback.services.js";
import type { Request, Response } from "express";

export const createFeedbackController = asyncHandler(async (req: Request, res: Response) => {
  const { toUser, rating, comment } = req.body;
  if (!toUser || !rating || !comment) {
    throw new ApiError(400, "toUser, rating, and comment are required");
  }
  if(!req.user || !req.user._id) {
    throw new ApiError(401, "Unauthorized: User not authenticated");
  }
  const feedback = await createFeedbackService(req.user._id, { toUser, rating, comment });
  return res.status(201).json(new ApiResponse(201, feedback, "Feedback submitted successfully"));
});

export const getFeedbackForUserController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await getFeedbackForUserService(userId.toString());
  return res.status(200).json(new ApiResponse(200, result, "Feedback fetched successfully"));
});

export const deleteFeedbackController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user || !req.user._id) { 
    throw new ApiError(401, "Unauthorized: User not authenticated");
  }
  if (req.user.role !== "Admin") {
    throw new ApiError(403, "Only admins can delete feedback");
  }
  if(!req.params.id) {
    throw new ApiError(400, "Feedback ID is required");
  }
  await deleteFeedbackService(req.params.id.toString());
  return res.status(200).json(new ApiResponse(200, {}, "Feedback deleted successfully"));
});
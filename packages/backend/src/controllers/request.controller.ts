import {
  getAllRequestsService,
  addRequestService,
  updateRequestService,
} from "../services/request.services.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const getAllRequestsController = asyncHandler(async (req, res) => {
  const userId = req.user!._id;
  const requests = await getAllRequestsService(userId);
  return res
    .status(200)
    .json(new ApiResponse(200, requests, "Requests retrieved successfully"));
});

export const addRequestController = asyncHandler(async (req, res) => {
  const { toUserId, message, skillId } = req.body;
  if (
    typeof toUserId !== "string" ||
    !mongoose.isValidObjectId(toUserId) ||
    typeof skillId !== "string" ||
    !mongoose.isValidObjectId(skillId) ||
    (message !== undefined && (typeof message !== "string" || !message.trim()))
  ) {
    throw new ApiError(400, "toUserId and skillId are required");
  }

  try {
    const request = await addRequestService(
      req.user!._id,
      toUserId,
      message,
      skillId,
    );
    return res
      .status(200)
      .json(new ApiResponse(200, request, "Request added successfully"));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new ApiError(
        409,
        "You have already sent a request to this user for this skill",
      );
    }
    throw error;
  }
});

export const updateRequestController = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  if (
    !requestId ||
    !mongoose.isValidObjectId(requestId) ||
    !["accepted", "rejected"].includes(status)
  ) {
    throw new ApiError(400, "Request ID and status are required");
  }

  const updatedRequest = await updateRequestService(
    String(requestId),
    req.user!._id,
    status,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedRequest, "Request updated successfully"));
});

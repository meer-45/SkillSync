import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  getAllSessionsService,
  createSessionService,
  getSessionByIdService,
  updateSessionService,
  deleteSessionService,
} from "../services/session.services.js";

export const getAllSessionsController = asyncHandler(async (req, res) => {
  const sessions = await getAllSessionsService(req.user!._id);
  return res
    .status(200)
    .json(new ApiResponse(200, sessions, "Sessions retrieved successfully"));
});

export const createSessionController = asyncHandler(async (req, res) => {
  const { teacherId, learnerId, skillId, startTime, endTime } = req.body;
  if (!teacherId || !learnerId || !skillId || !startTime || !endTime) {
    throw new ApiError(
      400,
      "teacherId, learnerId, skillId, startTime and endTime are all required",
    );
  }

  const session = await createSessionService({
    teacherId,
    learnerId,
    skillId,
    startTime,
    endTime,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, session, "Session created successfully"));
});

export const getSessionByIdController = asyncHandler(async (req, res) => {
  if (!req.params.id) throw new ApiError(400, "Session ID is required");
  const session = await getSessionByIdService(String(req.params.id), req.user!._id);
  return res
    .status(200)
    .json(new ApiResponse(200, session, "Session retrieved successfully"));
});

export const updateSessionController = asyncHandler(async (req, res) => {
  if (!req.params.id) throw new ApiError(400, "Session ID is required");
  if (!req.body.status) throw new ApiError(400, "Status is required");

  const session = await updateSessionService(
    String(req.params.id),
    req.user!._id,
    req.body.status,
  );
  return res
    .status(200)
    .json(new ApiResponse(200, session, "Session updated successfully"));
});

export const deleteSessionController = asyncHandler(async (req, res) => {
  if (!req.params.id) throw new ApiError(400, "Session ID is required");
  await deleteSessionService(String(req.params.id), req.user!._id);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Session cancelled successfully"));
});

import mongoose from "mongoose";
import Request, {
  RequestDocument,
} from "../models/request.models.js";
import ApiError from "../utils/ApiError.js";
import { createNotification } from "./notification.service.js";

type UserId = string | mongoose.Types.ObjectId;
type RequestStatus = "pending" | "accepted" | "rejected";

export const getAllRequestsService = async (userId: UserId) => {
  return Request.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
    .populate("fromUserId", "fullName username email")
    .populate("toUserId", "fullName username email")
    .populate("skillId", "name category")
    .sort({ createdAt: -1 });
};

export const addRequestService = async (
  fromUserId: UserId,
  toUserId: UserId,
  message: string,
  skillId: UserId,
): Promise<RequestDocument> => {
  if (fromUserId.toString() === toUserId.toString()) {
    throw new ApiError(400, "Cannot send request to yourself");
  }

  const newRequest = new Request({
    fromUserId,
    toUserId,
    message,
    skillId,
    status: "pending",
  });
  await newRequest.save();

  await createNotification({
    userId: toUserId,
    type: "request_received",
    message: "You have a new skill exchange request",
    link: "/requests",
    fromUser: fromUserId,
  });

  return newRequest;
};

export const updateRequestService = async (
  requestId: UserId,
  userId: UserId,
  status: RequestStatus,
): Promise<RequestDocument> => {
  const request = await Request.findOne({ _id: requestId, toUserId: userId });
  if (!request) {
    throw new ApiError(
      404,
      "Request not found or you are not authorized to update it",
    );
  }

  request.status = status;
  await request.save();

  if (status === "accepted" || status === "rejected") {
    await createNotification({
      userId: request.fromUserId,
      type:
        status === "accepted" ? "request_accepted" : "request_rejected",
      message:
        status === "accepted"
          ? "Your skill exchange request was accepted! 🎉"
          : "Your skill exchange request was declined.",
      link: "/requests",
      fromUser: userId,
    });
  }

  return request;
};

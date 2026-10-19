import mongoose from "mongoose";
import Feedback, {
  FeedbackDocument,
} from "../models/feedback.models.js";
import ApiError from "../utils/ApiError.js";
import { createNotification } from "./notification.service.js";

type UserId = string | mongoose.Types.ObjectId;

type CreateFeedbackInput = {
  toUser: UserId;
  rating: number;
  comment: string;
};

export const createFeedbackService = async (
  fromUser: UserId,
  { toUser, rating, comment }: CreateFeedbackInput,
): Promise<FeedbackDocument> => {
  if (fromUser.toString() === toUser.toString()) {
    throw new ApiError(400, "You cannot leave feedback for yourself");
  }

  const feedback = await Feedback.create({ fromUser, toUser, rating, comment });

  await createNotification({
    userId: toUser,
    type: "feedback_received",
    message: `You received a ${rating}⭐ rating! Check your feedback.`,
    link: `/feedback/${toUser.toString()}`,
    fromUser,
  });

  return feedback;
};

export const getFeedbackForUserService = async (userId: UserId) => {
  const feedbacks = await Feedback.find({ toUser: userId })
    .populate("fromUser", "fullName username")
    .sort({ createdAt: -1 });

  const totalRatings = feedbacks.length;
  const averageRating =
    totalRatings > 0
      ? (feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) /
          totalRatings).toFixed(1)
      : null;

  return { feedbacks, totalRatings, averageRating };
};

export const deleteFeedbackService = async (
  feedbackId: UserId,
): Promise<boolean> => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throw new ApiError(404, "Feedback not found");
  await Feedback.findByIdAndDelete(feedbackId);
  return true;
};

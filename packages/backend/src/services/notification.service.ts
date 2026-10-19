import mongoose from "mongoose";
import Notification, {
  NotificationType,
} from "../models/notification.models.js";

type UserId = string | mongoose.Types.ObjectId;

type CreateNotificationInput = {
  userId: UserId;
  type: NotificationType;
  message: string;
  link?: string;
  fromUser?: UserId | null;
};

/**
 * Create a notification for a user
 */
export const createNotification = async ({
  userId,
  type,
  message,
  link = "",
  fromUser = null,
}: CreateNotificationInput): Promise<void> => {
  try {
    await Notification.create({ userId, type, message, link, fromUser });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown notification error";
    console.error(`Failed to create notification: ${message}`);
  }
};

/**
 * Get all notifications for a user
 */
export const getNotificationsService = async (userId: UserId) => {
  const notifications = await Notification.find({ userId })
    .populate("fromUser", "fullName username")
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  return { notifications, unreadCount };
};

/**
 * Mark a single notification as read
 */
export const markAsReadService = async (
  notificationId: UserId,
  userId: UserId,
): Promise<void> => {
  await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true }
  );
};

/**
 * Mark all notifications as read
 */
export const markAllAsReadService = async (userId: UserId): Promise<void> => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

/**
 * Delete a notification
 */
export const deleteNotificationService = async (
  notificationId: UserId,
  userId: UserId,
): Promise<void> => {
  await Notification.findOneAndDelete({ _id: notificationId, userId });
};
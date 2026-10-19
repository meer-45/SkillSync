import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export type NotificationType =
  | "request_received"
  | "request_accepted"
  | "request_rejected"
  | "session_created"
  | "session_completed"
  | "session_cancelled"
  | "feedback_received"
  | "tokens_earned";

export interface NotificationFields {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  link: string;
  isRead: boolean;
  fromUser: mongoose.Types.ObjectId | null;
}

export type NotificationDocument = HydratedDocument<NotificationFields>;
export type NotificationModel = Model<NotificationFields>;

const notificationSchema = new Schema<NotificationFields>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "request_received",
        "request_accepted",
        "request_rejected",
        "session_created",
        "session_completed",
        "session_cancelled",
        "feedback_received",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model<NotificationFields, NotificationModel>(
  "Notification",
  notificationSchema,
);

export default Notification;

import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export interface MessageFields {
  roomId: string;
  sender: mongoose.Types.ObjectId;
  message: string;
  isRead: boolean;
}

export type MessageDocument = HydratedDocument<MessageFields>;
export type MessageModel = Model<MessageFields>;

const messageSchema = new Schema<MessageFields>(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Message = mongoose.model<MessageFields, MessageModel>(
  "Message",
  messageSchema,
);

export default Message;

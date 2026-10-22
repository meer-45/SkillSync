import mongoose from "mongoose";

export type RequestFields = {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  message?: string;
  status?: "pending" | "accepted" | "rejected";
};

export type RequestDocument = mongoose.Document & RequestFields;

export type RequestModel = mongoose.Model<RequestDocument>; 

const requestSchema = new mongoose.Schema<RequestDocument, RequestModel>(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
      index: true,
    },
    message: {
      type: String,
      default: "",
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate active requests
requestSchema.index(
  { fromUserId: 1, toUserId: 1, skillId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

const Request = mongoose.model<RequestDocument, RequestModel>(
  "Request",
  requestSchema,
);

export { Request };
export default Request;
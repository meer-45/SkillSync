import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export interface FeedbackFields {
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

export type FeedbackDocument = HydratedDocument<FeedbackFields>;
export type FeedbackModel = Model<FeedbackFields>;

const feedbackSchema = new Schema<FeedbackFields>(
  {
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  { timestamps: true },
);

feedbackSchema.pre("validate", function (this: FeedbackDocument) {
  if (this.fromUser.equals(this.toUser)) {
    throw new Error("You cannot leave feedback for yourself");
  }
});

feedbackSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

const Feedback = mongoose.model<FeedbackFields, FeedbackModel>(
  "Feedback",
  feedbackSchema,
);

export default Feedback;

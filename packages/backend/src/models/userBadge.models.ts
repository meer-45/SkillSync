import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export interface UserBadgeFields {
  user: mongoose.Types.ObjectId;
  badgeId: string;
  earned: boolean;
  progress: number;
  earnedAt: Date | null;
}

export type UserBadgeDocument = HydratedDocument<UserBadgeFields>;
export type UserBadgeModel = Model<UserBadgeFields>;

const userBadgeSchema = new Schema<UserBadgeFields>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    badgeId: {
      type: String,
      required: true,
    },
    earned: {
      type: Boolean,
      default: false,
    },
    progress: {
      type: Number,
      default: 0,
    },
    earnedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userBadgeSchema.index({ user: 1, badgeId: 1 }, { unique: true });

export const UserBadge = mongoose.model<UserBadgeFields, UserBadgeModel>(
  "UserBadge",
  userBadgeSchema,
);

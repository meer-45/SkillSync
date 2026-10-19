import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export interface WalletFields {
  userId: mongoose.Types.ObjectId;
  balance: number;
}

export type WalletDocument = HydratedDocument<WalletFields>;
export type WalletModel = Model<WalletFields>;

const walletSchema = new Schema<WalletFields>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

const Wallet = mongoose.model<WalletFields, WalletModel>(
  "Wallet",
  walletSchema,
);

export default Wallet;

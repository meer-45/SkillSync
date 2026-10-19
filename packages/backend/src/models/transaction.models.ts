import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

export type TransactionType = "earn" | "spend" | "transfer" | "reward";

export interface TransactionFields {
  fromUser: mongoose.Types.ObjectId | null;
  toUser: mongoose.Types.ObjectId;
  amount: number;
  transactionType: TransactionType;
}

export type TransactionDocument = HydratedDocument<TransactionFields>;
export type TransactionModel = Model<TransactionFields>;

const transactionSchema = new Schema<TransactionFields>(
  {
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    transactionType: {
      type: String,
      enum: ["earn", "spend", "transfer", "reward"],
      required: true,
    },
  },
  { timestamps: true },
);

const Transaction = mongoose.model<TransactionFields, TransactionModel>(
  "Transaction",
  transactionSchema,
);

export default Transaction;

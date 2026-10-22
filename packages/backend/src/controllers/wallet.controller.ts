import Wallet from "../models/wallet.models.js";
import Transaction from "../models/transaction.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

export const getWalletController = asyncHandler(async (req, res) => {
  let wallet = await Wallet.findOne({ userId: req.user!._id });

  if (!wallet) {
    wallet = await Wallet.findOneAndUpdate(
      { userId: req.user!._id },
      { $setOnInsert: { userId: req.user!._id, balance: 0 } },
      { upsert: true, new: true },
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, wallet, "Wallet fetched successfully"));
});

export const transferTokensController = asyncHandler(async (req, res) => {
  const { toUserId, amount } = req.body;

  if (
    !toUserId ||
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    !Number.isFinite(amount) ||
    amount > 100000 ||
    !mongoose.isValidObjectId(toUserId)
  ) {
    throw new ApiError(400, "toUserId and amount are required");
  }
  if (amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }
  if (!(await User.exists({ _id: toUserId }))) {
    throw new ApiError(404, "Recipient not found");
  }
  if (toUserId.toString() === req.user!._id.toString()) {
    throw new ApiError(400, "Cannot transfer tokens to yourself");
  }

  const session = await mongoose.startSession();
  let transaction;
  try {
    await session.withTransaction(async () => {
      const senderWallet = await Wallet.findOneAndUpdate(
        { userId: req.user!._id, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true, session },
      );
      if (!senderWallet) throw new ApiError(400, "Insufficient balance");
      await Wallet.findOneAndUpdate(
        { userId: toUserId },
        { $inc: { balance: amount }, $setOnInsert: { userId: toUserId } },
        { upsert: true, new: true, session },
      );
      [transaction] = await Transaction.create([{
        fromUser: req.user!._id,
        toUser: toUserId,
        amount,
        transactionType: "transfer",
      }], { session });
    });
  } finally {
    await session.endSession();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, transaction, "Tokens transferred successfully"));
});

export const rewardTokensController = asyncHandler(async (req, res) => {
  const { toUserId, amount } = req.body;

  if (
    !toUserId ||
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    !Number.isFinite(amount) ||
    amount > 100000 ||
    !mongoose.isValidObjectId(toUserId)
  ) {
    throw new ApiError(400, "toUserId and amount are required");
  }
  if (amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }
  if (!(await User.exists({ _id: toUserId }))) {
    throw new ApiError(404, "Recipient not found");
  }

  const session = await mongoose.startSession();
  let transaction;
  try {
    await session.withTransaction(async () => {
      await Wallet.findOneAndUpdate(
        { userId: toUserId },
        { $inc: { balance: amount }, $setOnInsert: { userId: toUserId } },
        { upsert: true, new: true, session },
      );
      [transaction] = await Transaction.create([{
        fromUser: null,
        toUser: toUserId,
        amount,
        transactionType: "reward",
      }], { session });
    });
  } finally {
    await session.endSession();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, transaction, "Tokens rewarded successfully"));
});

export const getTransactionsController = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({
    $or: [{ fromUser: req.user!._id }, { toUser: req.user!._id }],
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("fromUser", "fullName username")
    .populate("toUser", "fullName username");

  return res
    .status(200)
    .json(new ApiResponse(200, transactions, "Transactions fetched successfully"));
});

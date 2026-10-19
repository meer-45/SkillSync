import Wallet from "../models/wallet.models.js";
import Transaction from "../models/transaction.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

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

  if (!toUserId || !amount) {
    throw new ApiError(400, "toUserId and amount are required");
  }
  if (amount <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const senderWallet = await Wallet.findOne({ userId: req.user!._id });
  if (!senderWallet || senderWallet.balance < amount) {
    throw new ApiError(400, "Insufficient balance");
  }

  let receiverWallet = await Wallet.findOne({ userId: toUserId });
  if (!receiverWallet) {
    receiverWallet = await Wallet.create({ userId: toUserId, balance: 0 });
  }

  senderWallet.balance -= amount;
  await senderWallet.save();
  receiverWallet.balance += amount;
  await receiverWallet.save();

  const transaction = await Transaction.create({
    fromUser: req.user!._id,
    toUser: toUserId,
    amount,
    transactionType: "transfer",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, transaction, "Tokens transferred successfully"));
});

export const rewardTokensController = asyncHandler(async (req, res) => {
  const { toUserId, amount } = req.body;

  if (!toUserId || !amount) {
    throw new ApiError(400, "toUserId and amount are required");
  }

  let wallet = await Wallet.findOne({ userId: toUserId });
  if (!wallet) {
    wallet = await Wallet.create({ userId: toUserId, balance: 0 });
  }

  wallet.balance += amount;
  await wallet.save();

  const transaction = await Transaction.create({
    fromUser: null,
    toUser: toUserId,
    amount,
    transactionType: "reward",
  });

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

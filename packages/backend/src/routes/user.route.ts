import { Router } from "express";
import {
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  searchUsersController,
  deleteCurrentUserController,
} from "../controllers/user.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/", verifyJWT, verifyAdmin, getAllUsersController);
router.get("/search", verifyJWT, searchUsersController);
router.delete("/me", verifyJWT, deleteCurrentUserController);
router.get("/:id", verifyJWT, getUserByIdController);
router.put("/:id", verifyJWT, updateUserController);
router.delete("/:id", verifyJWT, verifyAdmin, deleteUserController);

export default router;

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  getAllSessionsController,
  createSessionController,
  getSessionByIdController,
  updateSessionController,
  deleteSessionController,
} from "../controllers/session.controller.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getAllSessionsController)
  .post(createSessionController);

router
  .route("/:id")
  .get(getSessionByIdController)
  .put(updateSessionController)
  .delete(deleteSessionController);

export default router;

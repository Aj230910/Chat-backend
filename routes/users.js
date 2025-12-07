import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getAllUsers,
  updateUser,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/all", auth, getAllUsers);
router.put("/update-profile", auth, updateUser);

export default router;

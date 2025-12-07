import express from "express";
import {
  sendMessageREST,
  getConversation,
  deleteMessageForAll,
} from "../controllers/messageController.js";

import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, sendMessageREST);
router.get("/:userId1/:userId2", auth, getConversation);
router.delete("/delete-for-all/:messageId", auth, deleteMessageForAll);

export default router;

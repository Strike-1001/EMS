import express from "express";
import {
  sendBroadcastMessage,
  getBroadcastMessages,
  markMessageAsRead,
  deleteMessage,
  getMessageStats
} from "../controller/Message.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/auth.js";

const router = express.Router();

// User routes (DMs removed; broadcast only)
router.get("/broadcast", requireSignIn, isUser, getBroadcastMessages);
router.put("/:id/read", requireSignIn, isUser, markMessageAsRead);
router.delete("/:id", requireSignIn, isUser, deleteMessage);
router.get("/stats", requireSignIn, isUser, getMessageStats);

// Admin routes
router.post("/broadcast", requireSignIn, isAdmin, sendBroadcastMessage);

export default router; 
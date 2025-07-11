import express from "express";
import {
  sendMessage,
  sendBroadcastMessage,
  getInboxMessages,
  getSentMessages,
  getBroadcastMessages,
  markMessageAsRead,
  deleteMessage,
  getMessageStats
} from "../controller/Message.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/Auth.js";

const router = express.Router();

// User routes
router.post("/send", requireSignIn, isUser, sendMessage);
router.get("/inbox", requireSignIn, isUser, getInboxMessages);
router.get("/sent", requireSignIn, isUser, getSentMessages);
router.get("/broadcast", requireSignIn, isUser, getBroadcastMessages);
router.put("/:id/read", requireSignIn, isUser, markMessageAsRead);
router.delete("/:id", requireSignIn, isUser, deleteMessage);
router.get("/stats", requireSignIn, isUser, getMessageStats);

// Admin routes
router.post("/broadcast", requireSignIn, isAdmin, sendBroadcastMessage);

export default router; 
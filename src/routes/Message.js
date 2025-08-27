import express from "express";
import {
  sendBroadcastMessage,
  getBroadcastMessages,
  markMessageAsRead,
  deleteMessage,
  getMessageStats,
  updateBroadcastMessage,
  deleteBroadcastMessage
} from "../controller/Message.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/auth.js";

const router = express.Router();

// Test route to verify Message routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Message routes are working", timestamp: new Date().toISOString() });
});

// Admin broadcast routes (must come before generic routes to avoid conflicts)
router.post("/broadcast", requireSignIn, isAdmin, sendBroadcastMessage);
router.put("/broadcast/:id", requireSignIn, isAdmin, updateBroadcastMessage);
router.delete("/broadcast/:id", requireSignIn, isAdmin, deleteBroadcastMessage);

// User routes (DMs removed; broadcast only)
router.get("/broadcast", requireSignIn, isUser, getBroadcastMessages);
router.put("/:id/read", requireSignIn, isUser, markMessageAsRead);
router.delete("/:id", requireSignIn, isUser, deleteMessage);
router.get("/stats", requireSignIn, isUser, getMessageStats);

export default router; 
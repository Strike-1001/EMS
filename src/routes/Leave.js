import express from "express";
import {
  requestLeave,
  getAllLeaveRequests,
  getEmployeeLeaveHistory,
  updateLeaveStatus,
  getLeaveStats
} from "../controller/Leave.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/Auth.js";

const router = express.Router();

// User routes
router.post("/request", requireSignIn, isUser, requestLeave);
router.get("/history", requireSignIn, isUser, getEmployeeLeaveHistory);

// Admin routes
router.get("/", requireSignIn, isAdmin, getAllLeaveRequests);
router.put("/:id/status", requireSignIn, isAdmin, updateLeaveStatus);
router.get("/stats", requireSignIn, isAdmin, getLeaveStats);

export default router; 
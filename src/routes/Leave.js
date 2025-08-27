import express from "express";
import {
  requestLeave,
  getAllLeaveRequests,
  getEmployeeLeaveHistory,
  updateLeaveStatus,
  getLeaveStats,
  getLeaveAnalysisData,
  deleteLeaveRecord
} from "../controller/Leave.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/auth.js";

const router = express.Router();

// User routes
router.post("/request", requireSignIn, isUser, requestLeave);
router.get("/history", requireSignIn, isUser, getEmployeeLeaveHistory);

// Admin routes
router.get("/", requireSignIn, isAdmin, getAllLeaveRequests);
router.put("/:id/status", requireSignIn, isAdmin, updateLeaveStatus);
router.get("/stats", requireSignIn, isAdmin, getLeaveStats);
router.get("/analysis", requireSignIn, isAdmin, getLeaveAnalysisData);
router.delete("/:id", requireSignIn, isAdmin, deleteLeaveRecord);

export default router; 
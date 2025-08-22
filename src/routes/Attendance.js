import express from "express";
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getTodayAttendance,
  getAttendanceStats,
  getSalarySummary
} from "../controller/Attendance.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/auth.js";

const router = express.Router();

// User routes
router.post("/checkin", requireSignIn, isUser, checkIn);
router.post("/checkout", requireSignIn, isUser, checkOut);
router.get("/today", requireSignIn, isUser, getTodayAttendance);
router.get("/history", requireSignIn, isUser, getAttendanceHistory);
router.get("/salary/summary", requireSignIn, isUser, getSalarySummary);

// Admin routes
router.get("/stats", requireSignIn, isAdmin, getAttendanceStats);
router.get("/history/:employeeId", requireSignIn, isAdmin, getAttendanceHistory);

export default router; 
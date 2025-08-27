import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeDashboard,
  getEmployeePerformanceData,
  completeEmployeeProfile
} from "../controller/Employee.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/auth.js";

const router = express.Router();

// Admin routes
router.post("/", requireSignIn, isAdmin, createEmployee);
router.get("/", requireSignIn, isAdmin, getAllEmployees);
router.get("/performance/reports", requireSignIn, isAdmin, getEmployeePerformanceData);
router.get("/:id", requireSignIn, isAdmin, getEmployeeById);
router.put("/:id", requireSignIn, isAdmin, updateEmployee);
router.put("/:id/complete-profile", requireSignIn, isAdmin, completeEmployeeProfile);
router.delete("/:id", requireSignIn, isAdmin, deleteEmployee);

// User routes
router.get("/dashboard/profile", requireSignIn, isUser, getEmployeeDashboard);

export default router; 
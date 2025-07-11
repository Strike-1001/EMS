import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeDashboard
} from "../controller/Employee.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/Auth.js";

const router = express.Router();

// Admin routes
router.post("/", requireSignIn, isAdmin, createEmployee);
router.get("/", requireSignIn, isAdmin, getAllEmployees);
router.get("/:id", requireSignIn, isAdmin, getEmployeeById);
router.put("/:id", requireSignIn, isAdmin, updateEmployee);
router.delete("/:id", requireSignIn, isAdmin, deleteEmployee);

// User routes
router.get("/dashboard/profile", requireSignIn, isUser, getEmployeeDashboard);

export default router; 
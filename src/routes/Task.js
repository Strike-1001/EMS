import express from "express";
import {
  createTask,
  getAllTasks,
  getEmployeeTasks,
  updateTaskStatus,
  getTaskById,
  deleteTask,
  getTaskStats
} from "../controller/Task.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/Auth.js";

const router = express.Router();

// Admin routes
router.post("/", requireSignIn, isAdmin, createTask);
router.get("/", requireSignIn, isAdmin, getAllTasks);
router.get("/stats", requireSignIn, isAdmin, getTaskStats);
router.get("/:id", requireSignIn, isAdmin, getTaskById);
router.delete("/:id", requireSignIn, isAdmin, deleteTask);

// User routes
router.get("/employee/tasks", requireSignIn, isUser, getEmployeeTasks);
router.put("/:id/status", requireSignIn, isUser, updateTaskStatus);

export default router; 
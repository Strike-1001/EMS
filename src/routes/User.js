import express from "express";
import {
  registerController,
  loginController,
  getUserInfo
} from "../controller/User.js";
import {
  requireSignIn,
  isUser,
  isAdmin
} from "../middlewares/Auth.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);

router.get("/user", requireSignIn, isUser, getUserInfo);
router.get("/user-dashboard", requireSignIn, isUser, (req, res) => {
  res.status(200).json({ message: "User Dashboard", user: req.user });
});
router.get("/admin-dashboard", requireSignIn, isAdmin, (req, res) => {
  res.status(200).json({ message: "Admin Dashboard", user: req.user });
});

export default router;

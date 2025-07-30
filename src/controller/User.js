import User from "../models/User.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

// Register Controller
export const registerController = async (req, res) => {
  try {
    const { fullName, email, contact, password, role } = req.body;

    if (!fullName || !email || !contact || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role === "admin" ? "admin" : "user";

    const newUser = new User({
      name: fullName,
      email,
      contact,
      password: hashedPassword,
      role: userRole
    });

    await newUser.save();

    return res.status(201).json({
      message: `User registered successfully as ${userRole}`
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};

// Login Controller
export const loginController = async (req, res) => {
  console.log("⚡ Login route HIT");

  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials or role" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = JWT.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Token being sent in response:", token);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};

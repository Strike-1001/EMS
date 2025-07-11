// src/controller/User.js
import User from "../models/User.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

// Register Controller
export const registerController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

// Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

  //create and save user 
    const newUser = new User({ name, email, password: hashedPassword, role: 'user' });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};


export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Sign JWT token with user ID along with the role
    const token = JWT.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set JWT token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      role: user.role
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Get Authenticated User-Info
export const getUserInfo = (req, res) => {
  const token = req.cookies.token;

  // Ensure token exists
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Verify and decode token
  JWT.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    try {
      // Fetch user details from DB using decoded ID
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
};

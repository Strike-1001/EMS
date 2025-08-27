import User from "../models/User.js";
import JWT from "jsonwebtoken";
import bcrypt from "bcrypt";

// Register Controller
export const registerController = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    console.log('Registration attempt for:', { firstName, lastName, email, phone });

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate employee ID
    const employeeId = `EMP${Date.now()}`;

    // Create user with basic employee details (incomplete profile)
    const newUser = new User({
      name: `${firstName} ${lastName}`,
      email,
      contact: phone, // Keep for backward compatibility
      phone,
      password: hashedPassword,
      role: "user",
      employeeId,
      firstName,
      lastName,
      // Admin will complete these fields later
      department: null,
      position: null,
      hireDate: null,
      salary: null,
      status: 'pending' // New status for incomplete profiles
    });

    console.log('Creating user with data:', {
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      employeeId: newUser.employeeId,
      status: newUser.status
    });

    await newUser.save();
    console.log('User created successfully with ID:', newUser._id);

    // Verify user can be found for login
    const createdUser = await User.findOne({ email, role: "user" });
    if (createdUser) {
      console.log('User verified for login:', createdUser.email);
    } else {
      console.log('Warning: User not found after creation');
    }

    // Remove sensitive fields
    const safeUser = newUser.toObject();
    delete safeUser.password;

    return res.status(201).json({
      success: true,
      message: "Registration successful! An admin will complete your profile details.",
      user: safeUser
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: messages[0] || "Validation error" });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

// Login Controller
export const loginController = async (req, res) => {
  console.log("⚡ Login route HIT");
  console.log("Login request body:", req.body);

  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      console.log("Missing required fields:", { email: !!email, password: !!password, role: !!role });
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log("Looking for user with:", { email, role });

    const user = await User.findOne({ email, role });
    if (!user) {
      console.log("User not found with email and role");
      // Let's also check if user exists with just email
      const userByEmail = await User.findOne({ email });
      if (userByEmail) {
        console.log("User found by email only:", { 
          foundEmail: userByEmail.email, 
          foundRole: userByEmail.role,
          foundStatus: userByEmail.status 
        });
        return res.status(401).json({ error: "Invalid role. Please contact admin." });
      } else {
        console.log("No user found with this email");
        return res.status(401).json({ error: "Invalid credentials or role" });
      }
    }

    console.log("User found:", { 
      id: user._id, 
      email: user.email, 
      role: user.role, 
      status: user.status 
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch for user:", user.email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Password verified for user:", user.email);

    const token = JWT.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Token generated successfully");

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

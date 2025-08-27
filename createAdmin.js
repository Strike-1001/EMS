import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "./src/models/Admin.js";
import dotenv from "dotenv";

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/employee_management");
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@example.com" });
    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin = new Admin({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword
    });

    await admin.save();
    console.log("Default admin created successfully");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createDefaultAdmin();

import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDb } from "./src/config/db.js";
import authRoutes from "./src/routes/User.js";
import employeeRoutes from "./src/routes/Employee.js";
import attendanceRoutes from "./src/routes/Attendance.js";
import leaveRoutes from "./src/routes/Leave.js";
import messageRoutes from "./src/routes/Message.js";
import taskRoutes from "./src/routes/Task.js";
import adminRoutes from "./src/routes/Admin.js";

dotenv.config();

// Set fallback environment variables if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your_super_secret_jwt_key_here_change_in_production";
  console.log("⚠️  JWT_SECRET not found in environment, using fallback key");
}

if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = "mongodb://localhost:27017/employee_management";
  console.log("⚠️  MONGODB_URI not found in environment, using fallback URI");
}

const app = express();

// File path support for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS setup to allow frontend (supports local dev setups)
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin or curl/postman
    return callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight
// Note: Avoid wildcard pattern that throws on Express 5 path parser

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());
app.use(cookieParser());

// Serve static HTML frontend
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/user", authRoutes);

app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/tasks", taskRoutes);

// Dev test route
app.get("/test", (req, res) => {
  res.status(200).json({ status: "UP" });
});

// Root route for browser
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

//  Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 3000;

connectToDb()
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "blob:"],
      },
    })
  );
  
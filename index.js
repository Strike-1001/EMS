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

dotenv.config();
const app = express();

// File path support for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS setup to allow frontend
app.use(cors({
  origin: "http://127.0.0.1:5500", 
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());
app.use(cookieParser());

// Serve static HTML frontend
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth/api", authRoutes);

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
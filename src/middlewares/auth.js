import jwt from "jsonwebtoken";

// 1. Ensure user is logged in
export const requireSignIn = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains id and role
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// 2. User access: allows both 'user' and 'admin'
export const isUser = (req, res, next) => {
  if (["user", "admin"].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({ error: "User access only" });
};

// 3. Admin access only
export const isAdmin = (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Admin access only" });
};

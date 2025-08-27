import express from 'express';
import { registerAdmin, loginAdmin, logoutAdmin, updateProfile, changePassword } from '../controller/Admin.js';
import { requireSignIn, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Register admin
router.post('/register', registerAdmin);

// Login admin
router.post('/login', loginAdmin);

// Logout admin
router.post('/logout', logoutAdmin);

// Verify admin token
router.get('/verify', requireSignIn, isAdmin, (req, res) => {
  res.status(200).json({ 
    message: 'Token verified', 
    admin: req.user,
    valid: true 
  });
});

// Protected admin routes (example - add more as needed)
router.get('/dashboard', requireSignIn, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Admin Dashboard', admin: req.user });
});

// Profile and password
router.put('/profile', requireSignIn, isAdmin, updateProfile);
router.put('/change-password', requireSignIn, isAdmin, changePassword);

export default router; 
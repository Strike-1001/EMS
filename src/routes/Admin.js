import express from 'express';
import { registerAdmin, loginAdmin } from '../controller/Admin.js';

const router = express.Router();

// Register admin
router.post('/register', registerAdmin);

// Login admin
router.post('/login', loginAdmin);

export default router; 
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

// Register new admin
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ name, email, password: hashedPassword });
    await admin.save();
    res.status(201).json({ message: 'Admin registered successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Login admin
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    // For now, just return success (add JWT/session later if needed)
    res.status(200).json({ message: 'Login successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
}; 
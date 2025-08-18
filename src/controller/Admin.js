import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';
import JWT from 'jsonwebtoken';

// Register new admin
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Make the email search case-insensitive
    const existingAdmin = await Admin.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
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

    // Make the email search case-insensitive
    const admin = await Admin.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = JWT.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response with token
    res.status(200).json({ 
      message: 'Login successful.',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Logout admin
export const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update admin profile (name, avatar)
export const updateProfile = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
    const { name, avatar } = req.body;
    const update = {};
    if (name) update.name = name;
    if (avatar) update.avatar = avatar; // expect data URL or file URL (simple demo)
    const admin = await Admin.findByIdAndUpdate(adminId, update, { new: true });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.status(200).json({
      message: 'Profile updated',
      admin: { id: admin._id, name: admin.name, email: admin.email, avatar: admin.avatar }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) return res.status(401).json({ message: 'Unauthorized' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'All fields are required.' });
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    const ok = await bcrypt.compare(currentPassword, admin.password);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    admin.password = hashed;
    await admin.save();
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
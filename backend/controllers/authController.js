import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DB } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'premium_groceries_super_secret_key';
const JWT_EXPIRE = '30d';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const userExists = await DB.Users.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await DB.Users.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'user',
      preferences: {
        categories: [],
        dietary: 'none'
      },
      wishlist: [],
      cart: []
    });

    return res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token: generateToken(newUser._id)
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await DB.Users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email and new password' });
    }

    const user = await DB.Users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await DB.Users.findByIdAndUpdate(user._id, { password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await DB.Users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { password, ...safeUser } = user;
    return res.status(200).json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

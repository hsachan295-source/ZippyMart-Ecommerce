import jwt from 'jsonwebtoken';
import { DB } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'premium_groceries_super_secret_key';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const user = await DB.Users.findOne({ _id: decoded.id });
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      // Remove sensitive fields
      const { password, ...safeUser } = user;
      req.user = safeUser;
      next();
    } catch (error) {
      console.error('JWT Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};

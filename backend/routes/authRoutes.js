import express from 'express';
import { registerUser, loginUser, resetPassword, getProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);

export default router;

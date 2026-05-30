import express from 'express';
import { getSalesAnalytics, getInventoryStatus, getMlInsights } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/analytics', getSalesAnalytics);
router.get('/inventory', getInventoryStatus);
router.get('/ml-insights', getMlInsights);

export default router;

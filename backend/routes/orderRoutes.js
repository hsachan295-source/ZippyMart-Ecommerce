import express from 'express';
import { placeOrder, getMyOrders, getOrderById } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Secure all order routes

router.post('/', placeOrder);
router.get('/myorders', getMyOrders);
router.get('/:id', getOrderById);

export default router;

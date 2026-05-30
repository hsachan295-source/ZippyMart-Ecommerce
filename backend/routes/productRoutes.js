import express from 'express';
import { 
  getProducts, getProductById, createProductReview, 
  createProduct, updateProduct, deleteProduct 
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/:id/reviews', protect, createProductReview);

// Admin Restricted Catalog CRUD
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

export default router;

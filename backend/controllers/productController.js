import { DB } from '../config/db.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export const getProducts = async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice } = req.query;
    let products = await DB.Products.find();

    // Filtering by Category
    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Filtering by Search (name or description)
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    // Filtering by Price Range
    if (minPrice) {
      products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= parseFloat(maxPrice));
    }

    // Fetch dynamic pricing recommendations from ML service if active, or apply static fallback
    // We will do a batch price calculation if the ML service is active
    try {
      const pricesRes = await axios.get(`${ML_SERVICE_URL}/api/ml/pricing/all`);
      if (pricesRes.data && pricesRes.data.success) {
        const pricingMap = pricesRes.data.pricing; // Map of productId -> dynamicPrice
        products = products.map(p => ({
          ...p,
          price: pricingMap[p._id] || p.price,
          originalPrice: p.originalPrice || p.price,
          discount: pricingMap[p._id] ? Math.round((1 - (pricingMap[p._id] / (p.originalPrice || p.price))) * 100) : 0
        }));
      }
    } catch (e) {
      // ML service offline, use static or fallback heuristics
      products = products.map(p => ({
        ...p,
        originalPrice: p.originalPrice || p.price,
        discount: p.discount || 0
      }));
    }

    // Sorting
    if (sort) {
      if (sort === 'price_low') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price_high') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      }
    }

    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Get products error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching products' });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId || 'anonymous';

  try {
    const product = await DB.Products.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Apply dynamic pricing to individual item
    let adjustedProduct = { ...product };
    try {
      const priceRes = await axios.get(`${ML_SERVICE_URL}/api/ml/pricing/${id}`);
      if (priceRes.data && priceRes.data.success) {
        adjustedProduct.price = priceRes.data.dynamicPrice;
        adjustedProduct.originalPrice = product.originalPrice || product.price;
        adjustedProduct.discount = Math.round((1 - (adjustedProduct.price / adjustedProduct.originalPrice)) * 100);
      }
    } catch (e) {
      adjustedProduct.originalPrice = product.originalPrice || product.price;
      adjustedProduct.discount = product.discount || 0;
    }

    // Fetch AI-powered Recommendations (Frequently Bought Together, Similar, Personalized)
    let recommendations = {
      similar: [],
      boughtTogether: [],
      personalized: []
    };

    try {
      const recRes = await axios.get(`${ML_SERVICE_URL}/api/ml/recommendations`, {
        params: { productId: id, userId }
      });
      if (recRes.data && recRes.data.success) {
        recommendations = recRes.data.recommendations;
      }
    } catch (e) {
      // Fallback heuristics: find items of same category
      const sameCategory = await DB.Products.find({ category: product.category });
      recommendations.similar = sameCategory.filter(p => p._id !== id).slice(0, 4);
      recommendations.boughtTogether = sameCategory.filter(p => p._id !== id).slice(2, 6);
      recommendations.personalized = sameCategory.slice(0, 4);
    }

    // Fetch reviews
    const reviews = await DB.Reviews.find({ productId: id });

    return res.status(200).json({
      success: true,
      product: adjustedProduct,
      recommendations,
      reviews
    });
  } catch (error) {
    console.error('Get product by ID error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching product details' });
  }
};

export const createProductReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment, userName } = req.body;

  try {
    const product = await DB.Products.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // 1. Call AI Sentiment Analysis Service to detect polarity (positive/negative/neutral) and sentiment score
    let sentiment = 'Neutral';
    let sentimentScore = 0.0;

    try {
      const sentimentRes = await axios.post(`${ML_SERVICE_URL}/api/ml/sentiment`, { text: comment });
      if (sentimentRes.data && sentimentRes.data.success) {
        sentiment = sentimentRes.data.sentiment;
        sentimentScore = sentimentRes.data.score;
      }
    } catch (e) {
      // Local fallback heuristics
      const lower = comment.toLowerCase();
      const posWords = ['good', 'great', 'delicious', 'fresh', 'best', 'love', 'nice', 'awesome', 'excellent', 'amazing'];
      const negWords = ['bad', 'stale', 'rotten', 'late', 'poor', 'worst', 'expensive', 'sprawled', 'dislike'];
      
      let score = 0;
      posWords.forEach(w => { if (lower.includes(w)) score += 0.3; });
      negWords.forEach(w => { if (lower.includes(w)) score -= 0.3; });

      sentimentScore = Math.max(-1, Math.min(1, score));
      if (sentimentScore > 0.1) sentiment = 'Positive';
      else if (sentimentScore < -0.1) sentiment = 'Negative';
    }

    // Create Review
    const newReview = await DB.Reviews.create({
      productId: id,
      userName: userName || req.user?.name || 'Anonymous',
      userId: req.user?._id || 'anonymous',
      rating: parseFloat(rating),
      comment,
      sentiment,
      sentimentScore
    });

    // Update Product average rating
    const allReviews = await DB.Reviews.find({ productId: id });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = parseFloat((totalRating / allReviews.length).toFixed(1));

    await DB.Products.findByIdAndUpdate(id, {
      rating: avgRating,
      reviewCount: allReviews.length
    });

    return res.status(201).json({
      success: true,
      review: newReview,
      message: 'Review created and analyzed successfully!'
    });
  } catch (error) {
    console.error('Create review error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error creating review' });
  }
};

// Admin CRUD: Create new product
export const createProduct = async (req, res) => {
  const { name, description, price, originalPrice, category, image, stock, unit, discount, brand } = req.body;
  try {
    const productId = `prod_custom_${Math.random().toString(36).substr(2, 9)}`;
    const newProduct = await DB.Products.create({
      _id: productId,
      name,
      description,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice || price),
      category,
      image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
      stock: parseInt(stock || 0),
      unit: unit || '1 Unit',
      discount: parseInt(discount || 0),
      brand: brand || 'Generic',
      rating: 5.0,
      reviewCount: 0,
      deliveryTime: category === 'Electronics' || category === 'Computer Accessories' ? 'Next Day' : '10 mins'
    });
    saveLocalDb();
    return res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Create product error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error creating product' });
  }
};

// Admin CRUD: Update existing product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await DB.Products.findByIdAndUpdate(id, {
      ...req.body,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined,
      stock: req.body.stock !== undefined ? parseInt(req.body.stock) : undefined,
      discount: req.body.discount !== undefined ? parseInt(req.body.discount) : undefined
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    saveLocalDb();
    return res.status(200).json({ success: true, product: updated });
  } catch (error) {
    console.error('Update product error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating product' });
  }
};

// Admin CRUD: Delete product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await DB.Products.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await DB.Reviews.deleteMany({ productId: id });
    saveLocalDb();
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting product' });
  }
};

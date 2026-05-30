import { DB } from '../config/db.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export const getSalesAnalytics = async (req, res) => {
  try {
    const orders = await DB.Orders.find();
    const products = await DB.Products.find();
    const users = await DB.Users.find();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.isPaid ? o.totalPrice : 0), 0);
    const orderCount = orders.length;
    const customerCount = users.filter(u => u.role !== 'admin').length;
    
    // Revenue Trends by category
    const categorySales = {};
    orders.forEach(order => {
      if (order.isPaid) {
        order.orderItems.forEach(item => {
          const category = item.category || 'General';
          categorySales[category] = (categorySales[category] || 0) + (item.price * item.quantity);
        });
      }
    });

    const categoryPerformance = Object.entries(categorySales).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));

    return res.status(200).json({
      success: true,
      analytics: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        orderCount,
        customerCount,
        productCount: products.length,
        categoryPerformance
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error loading analytics' });
  }
};

export const getInventoryStatus = async (req, res) => {
  try {
    const products = await DB.Products.find();

    // Out of stock risk scores and stock warnings
    const inventoryReport = products.map(product => {
      const stock = product.stock;
      let riskScore = 0;
      let status = 'In Stock';
      let suggestedReorder = 0;

      if (stock === 0) {
        riskScore = 100;
        status = 'Out of Stock';
        suggestedReorder = 50;
      } else if (stock < 15) {
        riskScore = 75;
        status = 'Critical Risk';
        suggestedReorder = 30;
      } else if (stock < 40) {
        riskScore = 30;
        status = 'Low Stock';
        suggestedReorder = 15;
      }

      return {
        productId: product._id,
        name: product.name,
        category: product.category,
        stock,
        riskScore,
        status,
        suggestedReorder
      };
    });

    return res.status(200).json({
      success: true,
      inventory: inventoryReport
    });
  } catch (error) {
    console.error('Get inventory status error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error loading inventory data' });
  }
};

export const getMlInsights = async (req, res) => {
  try {
    // Attempt to query ML service for real calculations
    try {
      const mlRes = await axios.get(`${ML_SERVICE_URL}/api/ml/insights`);
      if (mlRes.data && mlRes.data.success) {
        return res.status(200).json(mlRes.data);
      }
    } catch (e) {
      console.warn('ML Service offline during insights compilation. Dispensing local analytics fallback.');
    }

    // High Fidelity ML Mock Fallback Data (so everything renders perfectly when starting up)
    const demandForecast = [
      { date: 'Mon', actualSales: 120, predictedSales: 125 },
      { date: 'Tue', actualSales: 135, predictedSales: 130 },
      { date: 'Wed', actualSales: 150, predictedSales: 155 },
      { date: 'Thu', actualSales: 140, predictedSales: 145 },
      { date: 'Fri', actualSales: 180, predictedSales: 175 },
      { date: 'Sat', actualSales: 210, predictedSales: 220 },
      { date: 'Sun', actualSales: 230, predictedSales: 240 }
    ];

    const customerSegments = [
      { name: 'Premium Buyers', count: 18, percentage: 22, description: 'High spenders, prefer premium fresh categories.' },
      { name: 'Budget Buyers', count: 32, percentage: 39, description: 'Price sensitive, shop discounted and bundle deals.' },
      { name: 'Frequent Buyers', count: 22, percentage: 27, description: 'Order 3-4 times a week, average cart size.' },
      { name: 'Occasional Buyers', count: 10, percentage: 12, description: 'Order monthly, high cart sizes.' }
    ];

    const sentimentOverview = {
      positive: 74,
      neutral: 16,
      negative: 10,
      totalCount: 120
    };

    return res.status(200).json({
      success: true,
      isMock: true,
      demandForecast,
      customerSegments,
      sentimentOverview
    });
  } catch (error) {
    console.error('Get ML Insights error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error reading ML insights' });
  }
};

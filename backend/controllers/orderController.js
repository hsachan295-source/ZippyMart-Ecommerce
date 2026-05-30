import { DB, saveLocalDb } from '../config/db.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export const placeOrder = async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    // Check inventory availability and adjust stock
    for (const item of orderItems) {
      const product = await DB.Products.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }
    }

    // Deduct inventory stock
    for (const item of orderItems) {
      const product = await DB.Products.findById(item.productId);
      const newStock = product.stock - item.quantity;
      await DB.Products.findByIdAndUpdate(item.productId, { stock: newStock });
    }

    const orderId = `ord_${Math.random().toString(36).substr(2, 9)}`;

    // Create Order in DB
    const newOrder = await DB.Orders.create({
      _id: orderId,
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      isPaid: paymentMethod === 'COD' ? false : true,
      paidAt: paymentMethod === 'COD' ? null : new Date().toISOString(),
      paymentResult: paymentMethod === 'COD' ? {} : {
        id: `pay_razorpay_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        update_time: new Date().toISOString(),
        email_address: req.user.email
      },
      isDelivered: false,
      deliveryStatus: 'Processing', // Processing -> Out for Delivery -> Delivered
      deliveryCoordinates: {
        lat: 28.6139 + (Math.random() - 0.5) * 0.02, // Delhi NCR region mock coordinates
        lng: 77.2090 + (Math.random() - 0.5) * 0.02
      },
      etaMinutes: 10 // ZippyMart style 10 mins delivery mock!
    });

    // Notify ML Service of purchase events for Demand Forecasting, Segmentation and Collaborative filtering
    try {
      await axios.post(`${ML_SERVICE_URL}/api/ml/sales-event`, {
        orderId: newOrder._id,
        userId: req.user._id,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          category: item.category || 'general'
        })),
        totalPrice,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('ML Service event dispatch failed. Continuing order process offline.');
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Place order error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error placing order' });
  }
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await DB.Orders.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check ownership
    if (order.user !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    // Simulated real-time tracking update:
    // If order was created recently, simulate delivery progression
    const elapsedMinutes = (new Date() - new Date(order.createdAt)) / 60000;
    let currentStatus = order.deliveryStatus;
    let eta = Math.max(0, Math.ceil(order.etaMinutes - elapsedMinutes));

    if (elapsedMinutes > 5 && elapsedMinutes <= 10 && order.deliveryStatus === 'Processing') {
      currentStatus = 'Out for Delivery';
      await DB.Orders.findByIdAndUpdate(id, { deliveryStatus: 'Out for Delivery' });
    } else if (elapsedMinutes > 10 && !order.isDelivered) {
      currentStatus = 'Delivered';
      await DB.Orders.findByIdAndUpdate(id, {
        deliveryStatus: 'Delivered',
        isDelivered: true,
        deliveredAt: new Date().toISOString()
      });
      eta = 0;
    }

    const updatedOrder = { ...order, deliveryStatus: currentStatus, etaMinutes: eta };
    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Get order by ID error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching order details' });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await DB.Orders.find({ user: req.user._id });
    // Sort descending by date
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Get my orders error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching order history' });
  }
};

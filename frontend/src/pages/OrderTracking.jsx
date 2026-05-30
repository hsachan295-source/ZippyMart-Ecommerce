import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { orderDetailSuccess, ordersStart } from '../store/store';
import axios from 'axios';
import { ArrowLeft, Clock, MapPin, Bike, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function OrderTracking({ orderId, setPage }) {
  const dispatch = useDispatch();
  const { activeOrder: order, loading } = useSelector((state) => state.orders);
  const [pulsePos, setPulsePos] = useState({ x: 20, y: 80 }); // Percentage along map path

  useEffect(() => {
    const fetchOrderDetails = async () => {
      dispatch(ordersStart());
      try {
        const res = await axios.get(`/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.data.success) {
          dispatch(orderDetailSuccess(res.data.order));
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      }
    };
    fetchOrderDetails();

    // Poll for tracking updates every 10 seconds
    const interval = setInterval(fetchOrderDetails, 10000);
    return () => clearInterval(interval);
  }, [dispatch, orderId]);

  // Animate the rider scooter coordinate along a mock path
  useEffect(() => {
    if (!order) return;
    const elapsedSecs = (new Date() - new Date(order.createdAt)) / 1000;
    
    // Simulate rider starting from warehouse (20, 80) and arriving at home (80, 20) over 120 seconds
    const duration = 120; // 2 minutes simulation loop
    const pct = Math.min(100, (elapsedSecs / duration) * 100);

    if (order.deliveryStatus === 'Delivered') {
      setPulsePos({ x: 80, y: 20 });
    } else if (order.deliveryStatus === 'Out for Delivery') {
      // Linear path interpolation
      const x = 20 + (80 - 20) * (pct / 100);
      const y = 80 - (80 - 20) * (pct / 100);
      setPulsePos({ x, y });
    } else {
      // Still processing at warehouse
      setPulsePos({ x: 20, y: 80 });
    }
  }, [order]);

  if (loading || !order) {
    return (
      <div class="space-y-6 py-12">
        <div class="h-10 w-24 bg-white/5 animate-pulse rounded-xl"></div>
        <div class="h-96 bg-white/5 animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  const isDelivered = order.deliveryStatus === 'Delivered';
  const isOut = order.deliveryStatus === 'Out for Delivery' || isDelivered;
  const isProcessing = order.deliveryStatus === 'Processing' || isOut;

  return (
    <div class="space-y-8 pb-12">
      {/* 1. Header Navigation */}
      <div class="flex justify-between items-center">
        <button
          onClick={() => setPage('order-history')}
          class="inline-flex items-center gap-2 px-4 py-2 bg-darkCard/40 border border-white/5 rounded-xl text-sm font-semibold text-gray-300 hover:text-emerald-400 hover:border-emerald-500/20 transition-all backdrop-blur-md"
        >
          <ArrowLeft class="w-4 h-4" />
          Order History
        </button>

        <span class="text-xs font-bold text-gray-400">Order ID: {order._id}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 2. Map & Details panel */}
        <div class="md:col-span-2 space-y-6">
          {/* ZippyMart style lightning banner */}
          <div class="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between gap-4 overflow-hidden relative">
            <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none"></div>
            <div class="space-y-2">
              <span class="inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase tracking-wider">
                Lightning Fast Delivery
              </span>
              <h2 class="text-2xl font-black text-white">
                {isDelivered ? 'Order Delivered!' : `Arriving in ${order.etaMinutes} mins`}
              </h2>
              <p class="text-xs text-gray-400">
                {isDelivered ? 'Your groceries have safely arrived at your destination.' : 'Rider is carrying your fresh items in an insulated, sanitary crate.'}
              </p>
            </div>
            <div class="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-bounce">
              <Clock class="w-8 h-8" />
            </div>
          </div>

          {/* Beautiful Custom SVG Live Map Tracker */}
          <div class="glass-panel rounded-3xl border border-white/5 overflow-hidden h-96 relative bg-darkBg/80 flex items-center justify-center p-2">
            <div class="absolute inset-0 bg-radial-gradient from-violet-500/5 to-transparent"></div>
            
            {/* Structural Grid lines representation */}
            <svg class="absolute inset-0 w-full h-full stroke-white/[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Map Roads & Route */}
            <svg class="w-full h-full relative z-10" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Road Network grids */}
              <path d="M50,150 L450,150" stroke="rgba(255,255,255,0.06)" stroke-width="12" stroke-linecap="round" />
              <path d="M50,350 L450,350" stroke="rgba(255,255,255,0.06)" stroke-width="12" stroke-linecap="round" />
              <path d="M150,50 L150,450" stroke="rgba(255,255,255,0.06)" stroke-width="12" stroke-linecap="round" />
              <path d="M350,50 L350,450" stroke="rgba(255,255,255,0.06)" stroke-width="12" stroke-linecap="round" />

              {/* Delivery Path (Warehouse [100, 400] to Customer Home [400, 100]) */}
              <path d="M100,400 L150,400 L150,150 L400,150 L400,100" stroke="rgba(16, 185, 129, 0.2)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M100,400 L150,400 L150,150 L400,150 L400,100" stroke="rgba(16, 185, 129, 0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 6 animate-dash" />

              {/* Warehouse Marker */}
              <g transform="translate(100, 400)">
                <circle r="16" fill="rgba(139, 92, 246, 0.15)" />
                <circle r="6" fill="#8b5cf6" />
                <text y="28" font-size="10" font-weight="bold" fill="#a78bfa" text-anchor="middle">ZippyMart Dark Store</text>
              </g>

              {/* Customer Home Marker */}
              <g transform="translate(400, 100)">
                <circle r="16" class="animate-pulse" fill="rgba(16, 185, 129, 0.2)" />
                <circle r="6" fill="#10b981" />
                <text y="-18" font-size="10" font-weight="bold" fill="#34d399" text-anchor="middle">Your Location</text>
              </g>

              {/* Moving Delivery Scooter Rider */}
              {!isDelivered && (
                <g transform={`translate(${pulsePos.x * 5}, ${pulsePos.y * 5})`}>
                  <circle r="18" fill="rgba(16, 185, 129, 0.25)" class="animate-ping" />
                  <rect x="-12" y="-12" width="24" height="24" rx="12" fill="#10b981" />
                  <foreignObject x="-8" y="-8" width="16" height="16">
                    <div xmlns="http://www.w3.org/1990/svg" class="text-white">
                      <Bike class="w-4 h-4" />
                    </div>
                  </foreignObject>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* 3. Steps Checklist & Items Summary */}
        <div class="space-y-6">
          {/* Tracking checklist */}
          <div class="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <h3 class="font-bold text-gray-200 text-sm">Delivery Milestones</h3>
            
            <div class="relative pl-6 space-y-6">
              {/* Vertical line indicator */}
              <div class="absolute left-[7px] top-2 bottom-2 w-0.5 bg-white/5"></div>

              {/* Step 1: Processing */}
              <div class="relative flex gap-3 text-xs">
                <div class={`absolute -left-[23px] w-4.5 h-4.5 rounded-full flex items-center justify-center border z-10 ${
                  isProcessing ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-darkBg border-white/10 text-gray-600'
                }`}>
                  <CheckCircle2 class="w-3 h-3" />
                </div>
                <div class={isProcessing ? 'text-gray-200 font-bold' : 'text-gray-500'}>
                  <span>Order Placed & Confirmed</span>
                  <p class="text-[10px] text-gray-400 font-normal">Inspected by dark store inventory managers</p>
                </div>
              </div>

              {/* Step 2: Out for Delivery */}
              <div class="relative flex gap-3 text-xs">
                <div class={`absolute -left-[23px] w-4.5 h-4.5 rounded-full flex items-center justify-center border z-10 ${
                  isOut ? 'bg-emerald-500 border-emerald-500 text-white' : order.deliveryStatus === 'Out for Delivery' ? 'bg-violet-500 border-violet-500 text-white animate-pulse' : 'bg-darkBg border-white/10 text-gray-600'
                }`}>
                  {order.deliveryStatus === 'Out for Delivery' ? <Bike class="w-3 h-3" /> : <CheckCircle2 class="w-3 h-3" />}
                </div>
                <div class={isOut ? 'text-gray-200 font-bold' : 'text-gray-500'}>
                  <span>Rider Picked Up</span>
                  <p class="text-[10px] text-gray-400 font-normal">Insulated delivery crate carrying fresh supplies</p>
                </div>
              </div>

              {/* Step 3: Delivered */}
              <div class="relative flex gap-3 text-xs">
                <div class={`absolute -left-[23px] w-4.5 h-4.5 rounded-full flex items-center justify-center border z-10 ${
                  isDelivered ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-darkBg border-white/10 text-gray-600'
                }`}>
                  <CheckCircle2 class="w-3 h-3" />
                </div>
                <div class={isDelivered ? 'text-gray-200 font-bold' : 'text-gray-500'}>
                  <span>Arrived & Handed Over</span>
                  <p class="text-[10px] text-gray-400 font-normal">Contactless handover completed successfully</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice basket summary */}
          <div class="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
            <h3 class="font-bold text-gray-200 text-sm">Receipt Summary</h3>
            <div class="space-y-3.5 max-h-40 overflow-y-auto pr-1">
              {order.orderItems.map((item, idx) => (
                <div key={idx} class="flex justify-between items-center text-xs">
                  <div class="space-y-0.5">
                    <span class="font-bold text-gray-300">{item.name}</span>
                    <span class="text-[10px] text-gray-400 block">{item.unit} x {item.quantity}</span>
                  </div>
                  <span class="font-semibold text-gray-300">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div class="border-t border-white/5 pt-3.5 space-y-2 text-xs">
              <div class="flex justify-between text-gray-400">
                <span>Items Subtotal</span>
                <span>₹{order.itemsPrice}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>Handling Fee & Tax</span>
                <span>₹{order.taxPrice}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>Delivery Charge</span>
                <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span>
              </div>
              <div class="flex justify-between text-sm font-extrabold text-white border-t border-white/5 pt-2">
                <span>Grand Total</span>
                <span>₹{order.totalPrice}</span>
              </div>
            </div>

            {/* Secured pay notice */}
            <div class="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-2">
              <ShieldCheck class="w-5 h-5 text-emerald-400" />
              <span class="text-[10px] text-gray-400 font-medium leading-tight">
                Payment verified securely by Razorpay Gateways.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

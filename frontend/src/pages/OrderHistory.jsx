import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ordersStart, ordersSuccess, ordersFail } from '../store/store';
import axios from 'axios';
import { ShoppingBag, ChevronRight, Eye, Calendar, DollarSign, Box } from 'lucide-react';

export default function OrderHistory({ setPage, setSelectedOrderId }) {
  const dispatch = useDispatch();
  const { myOrders: orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    const fetchOrders = async () => {
      dispatch(ordersStart());
      try {
        const res = await axios.get('/api/orders/myorders', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.data.success) {
          dispatch(ordersSuccess(res.data.orders));
        }
      } catch (err) {
        dispatch(ordersFail(err.response?.data?.message || 'Error loading orders'));
      }
    };
    fetchOrders();
  }, [dispatch]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div class="space-y-6 pb-12">
      <div class="border-b border-white/5 pb-3">
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <ShoppingBag class="w-6 h-6 text-emerald-400" />
          Your Order History
        </h2>
        <p class="text-gray-400 text-xs mt-1">Track and manage your lightning delivery orders</p>
      </div>

      {loading ? (
        <div class="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} class="h-28 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div class="text-center py-16 bg-darkCard/20 rounded-3xl border border-white/5 space-y-4">
          <Box class="w-12 h-12 text-gray-600 mx-auto" />
          <p class="text-gray-400 text-base">You haven't placed any grocery orders yet!</p>
          <button
            onClick={() => setPage('catalog')}
            class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Shop Catalogs
          </button>
        </div>
      ) : (
        <div class="space-y-4">
          {orders.map((order) => {
            const isDelivered = order.deliveryStatus === 'Delivered';
            const isOut = order.deliveryStatus === 'Out for Delivery';

            return (
              <div
                key={order._id}
                class="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-5 glass-panel-hover"
              >
                {/* Invoice Brief */}
                <div class="space-y-2.5">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="text-xs font-bold text-gray-300">ID: {order._id}</span>
                    <span
                      class={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        isDelivered
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isOut
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {order.deliveryStatus}
                    </span>
                  </div>

                  <div class="flex items-center gap-4 text-xs text-gray-400">
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3.5 h-3.5" />
                      {formatDate(order.createdAt)}
                    </span>
                    <span class="flex items-center gap-1 font-bold text-gray-300">
                      <DollarSign class="w-3.5 h-3.5" />
                      ₹{order.totalPrice}
                    </span>
                  </div>

                  <p class="text-xs text-gray-300 line-clamp-1">
                    Items: {order.orderItems.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                  </p>
                </div>

                {/* Track Trigger */}
                <div class="flex items-center gap-3 self-end md:self-auto">
                  <button
                    onClick={() => {
                      setSelectedOrderId(order._id);
                      setPage('order-tracking');
                    }}
                    class="py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 shadow-md hover:shadow-emerald-500/15"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    Track Order
                    <ChevronRight class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

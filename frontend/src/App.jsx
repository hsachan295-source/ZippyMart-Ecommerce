import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, clearCart, addToCart, removeFromCart, updateQuantity } from './store/store';
import axios from 'axios';
import { 
  ShoppingBag, User, LogOut, LayoutDashboard, Store, 
  Trash2, X, Plus, Minus, CreditCard, Send, Sparkles, MessageSquare, MapPin 
} from 'lucide-react';

// Import Pages
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import OrderHistory from './pages/OrderHistory';
import OrderTracking from './pages/OrderTracking';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);

  const [page, setPage] = useState('catalog');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // Drawer & Bot UI toggles
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [address, setAddress] = useState(localStorage.getItem('zippymart_address') || 'Sector 62, Noida, Uttar Pradesh');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Wishlist state — persisted in localStorage
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zippymart_wishlist') || '[]'); }
    catch { return []; }
  });

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p._id === product._id || p.id === product.id);
      const next = exists
        ? prev.filter(p => p._id !== product._id && p.id !== product.id)
        : [...prev, product];
      localStorage.setItem('zippymart_wishlist', JSON.stringify(next));
      return next;
    });
  };

  const isWishlisted = (productId) => wishlist.some(p => p._id === productId || p.id === productId);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          
          if (data && data.address) {
            const area = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road || "Sector 62";
            const city = data.address.city || data.address.town || data.address.village || "Noida";
            const state = data.address.state || "Uttar Pradesh";
            
            const resolvedAddress = `${area}, ${city}, ${state}`;
            setAddress(resolvedAddress);
            localStorage.setItem('zippymart_address', resolvedAddress);
            setLocationModalOpen(false);
          } else {
            throw new Error("Unable to reverse geocode.");
          }
        } catch (err) {
          console.warn("OSM reverse geocoding rate-limited or offline, deploying Delhi NCR fallback:", err.message);
          const fallbackAddress = "Sector 62, Noida, Uttar Pradesh";
          setAddress(fallbackAddress);
          localStorage.setItem('zippymart_address', fallbackAddress);
          setLocationModalOpen(false);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Enter your address manually below.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Position unavailable. Enter manually.");
            break;
          case error.TIMEOUT:
            setLocationError("Position request timed out.");
            break;
          default:
            setLocationError("Location detection failed.");
        }
      },
      { timeout: 8000 }
    );
  };
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Chat state
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hi! I am your AI grocery assistant ⚡ Ask me for breakfast ideas, track orders, or refund policies!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Set default authorization header if logged in
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const handleCheckout = async (paymentMethod) => {
    if (cartItems.length === 0) return;
    setCheckoutLoading(true);
    
    // Calculate receipt prices
    const itemsPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxPrice = Math.round(itemsPrice * 0.05); // 5% handling/GST fee
    const shippingPrice = itemsPrice > 99 ? 0 : 15; // Free over ₹99
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    try {
      const res = await axios.post('/api/orders', {
        orderItems: cartItems,
        shippingAddress: address,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        dispatch(clearCart());
        setCartOpen(false);
        setSelectedOrderId(res.data.order._id);
        setPage('order-tracking');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed. Check stock levels.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatQuery) return;

    const userMsg = chatQuery;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatQuery('');
    setChatLoading(true);

    try {
      // Gather active product lists & user orders to enrich chatbot intelligence
      let productsList = [];
      try {
        const prodRes = await axios.get('/api/products');
        if (prodRes.data.success) productsList = prodRes.data.products;
      } catch (err) {}

      let orderList = [];
      if (user) {
        try {
          const ordRes = await axios.get('/api/orders/myorders', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (ordRes.data.success) orderList = ordRes.data.orders;
        } catch (err) {}
      }

      // Query FastAPI ML chat engine
      const mlBaseUrl = import.meta.env.VITE_ML_URL || 'http://127.0.0.1:8000';
      const res = await axios.post(`${mlBaseUrl}/api/ml/chat`, {
        query: userMsg,
        userId: user?._id || 'anonymous',
        orderHistory: orderList
      });

      if (res.data.success) {
        setChatMessages(prev => [...prev, { sender: 'bot', text: res.data.response }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Apologies, I am experiencing connection issues. Please try again in a moment!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Compute Cart Summary
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Authentication guards
  if (!user) {
    if (page === 'register') return <Register setPage={setPage} />;
    return <Login setPage={setPage} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div class="min-h-screen flex flex-col justify-between">
      {/* 1. Translucent Nav Bar Header */}
      <header class="sticky top-0 z-40 bg-darkBg/65 backdrop-blur-lg border-b border-white/5 py-4 px-6">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div onClick={() => setPage('catalog')} class="flex items-center gap-2 cursor-pointer group shrink-0">
            <span class="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-violet-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-all">
              <ShoppingBag class="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <span class="font-extrabold text-xl tracking-tight text-white block group-hover:text-emerald-400 transition-colors">
                Zippy<span class="text-emerald-400">Mart</span>
              </span>
              <span class="text-[9px] font-black text-violet-400 tracking-widest uppercase block -mt-1">
                Data Science Platform
              </span>
            </div>
          </div>

          {/* Current Location Selector Widget */}
          <div 
            onClick={() => setLocationModalOpen(true)}
            class="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl cursor-pointer text-xs font-semibold text-gray-300 hover:text-emerald-400 transition-all max-w-[125px] md:max-w-[220px] truncate group shrink-0"
            title="Change Delivery Location"
          >
            <MapPin class="w-4 h-4 text-emerald-400 shrink-0 group-hover:animate-bounce" />
            <div class="text-left truncate">
              <span class="text-[8px] text-gray-400 font-bold block uppercase tracking-wider leading-none">Deliver To</span>
              <span class="truncate block text-[10px] text-gray-200 font-bold mt-0.5">{address}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav class="hidden md:flex items-center gap-2">
            <button
              onClick={() => setPage('catalog')}
              class={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                page === 'catalog' || page === 'product-detail'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Store class="w-4 h-4" />
              Store Catalog
            </button>
            
            <button
              onClick={() => setPage('order-history')}
              class={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                page === 'order-history' || page === 'order-tracking'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ShoppingBag class="w-4 h-4" />
              Receipts & Tracking
            </button>

            {isAdmin && (
              <button
                onClick={() => setPage('admin-dashboard')}
                class={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  page === 'admin-dashboard'
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    : 'text-gray-400 hover:text-violet-400'
                }`}
              >
                <LayoutDashboard class="w-4 h-4" />
                Admin Dashboard
              </button>
            )}
          </nav>

          {/* Cart & Profile Controls */}
          <div class="flex items-center gap-3">
            {/* Basket Bag trigger */}
            <button
              onClick={() => setCartOpen(true)}
              class="relative p-2.5 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-xl transition-all shadow-inner"
            >
              <ShoppingBag class="w-5.5 h-5.5" />
              {cartCount > 0 && (
                <span class="absolute -right-1.5 -top-1.5 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-darkBg shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Brief dropdown */}
            <div class="flex items-center gap-2 bg-white/5 border border-white/5 pl-2.5 pr-3 py-1.5 rounded-xl text-xs font-bold text-gray-300">
              <User class="w-4 h-4 text-gray-400" />
              <span class="max-w-[70px] truncate">{user.name}</span>
              <button
                onClick={() => dispatch(logout())}
                class="p-1 hover:text-rose-400 transition-colors"
                title="Sign out"
              >
                <LogOut class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Page Render viewport */}
      <main class="flex-1 max-w-7xl w-full mx-auto px-6 pt-8">
        {page === 'catalog' && (
          <Catalog
            setPage={setPage}
            setSelectedProductId={setSelectedProductId}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            isWishlisted={isWishlisted}
          />
        )}
        {page === 'product-detail' && (
          <ProductDetail
            productId={selectedProductId}
            setPage={setPage}
            setSelectedProductId={setSelectedProductId}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
            isWishlisted={isWishlisted}
          />
        )}
        {page === 'order-history' && (
          <OrderHistory setPage={setPage} setSelectedOrderId={setSelectedOrderId} />
        )}
        {page === 'order-tracking' && (
          <OrderTracking orderId={selectedOrderId} setPage={setPage} />
        )}
        {page === 'admin-dashboard' && isAdmin && (
          <AdminDashboard />
        )}
      </main>

      {/* 3. Floating AI Chatbot Grocery Assistant Panel */}
      <div class="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Expanded Chat view */}
        {chatOpen && (
          <div class="w-80 md:w-96 h-96 glass-panel rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden mb-4 relative">
            <div class="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none"></div>
            
            {/* Bot header */}
            <div class="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between relative z-10">
              <div class="flex items-center gap-2">
                <Sparkles class="w-5 h-5 text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
                <div>
                  <h4 class="font-bold text-xs text-white">Grocery Assistant AI</h4>
                  <span class="text-[8.5px] text-emerald-400 font-bold block -mt-0.5 animate-pulse">ML model active</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} class="text-gray-400 hover:text-white transition-colors">
                <X class="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Bubble logs container */}
            <div class="flex-1 overflow-y-auto p-4 space-y-3.5 relative z-10 scrollbar-thin">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  class={`flex flex-col max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    class={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-500/10'
                        : 'bg-white/5 border border-white/5 text-gray-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx} class="min-h-[12px]">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div class="mr-auto p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-gray-400 animate-pulse">
                  AI is computing recommendations...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} class="p-3 border-t border-white/5 bg-darkBg/80 flex gap-2 relative z-10">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Suggest healthy breakfast..."
                class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <button
                type="submit"
                class="p-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-md transition-all active:scale-95"
              >
                <Send class="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Bubble button */}
        <button
          onClick={() => setChatOpen(prev => !prev)}
          class="p-4 bg-gradient-to-tr from-emerald-500 to-violet-500 hover:from-emerald-400 hover:to-violet-400 text-white rounded-full shadow-2xl shadow-emerald-500/20 hover:shadow-violet-500/35 transition-all flex items-center justify-center active:scale-95 group relative border border-white/10"
        >
          <MessageSquare class="w-6.5 h-6.5 group-hover:rotate-6 transition-transform" />
          <span class="absolute -left-28 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md border border-white/5 px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-white opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none uppercase tracking-wider">
            AI Assistant
          </span>
        </button>
      </div>

      {/* 4. Sliding Basket Drawer Panel (Right Side Drawer) */}
      {cartOpen && (
        <div class="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div class="w-full max-w-md h-full bg-darkBg border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden relative">
            <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"></div>

            {/* Drawer Header */}
            <div class="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between relative z-10">
              <div class="flex items-center gap-2">
                <ShoppingBag class="w-5.5 h-5.5 text-emerald-400" />
                <h3 class="font-extrabold text-base text-gray-200">Your Basket ({cartCount} items)</h3>
              </div>
              <button onClick={() => setCartOpen(false)} class="text-gray-400 hover:text-white transition-colors">
                <X class="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Basket Items List */}
            <div class="flex-1 overflow-y-auto p-5 space-y-4 relative z-10 scrollbar-thin">
              {cartItems.length === 0 ? (
                <div class="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <ShoppingBag class="w-12 h-12 text-gray-600" />
                  <p class="text-gray-400 text-sm italic">Your shopping basket is completely empty.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.productId} class="p-3.5 bg-white/5 rounded-2xl border border-white/5 flex gap-4">
                    <img src={item.image} alt={item.name} class="w-14 h-14 object-cover rounded-xl" />
                    
                    <div class="flex-1 flex flex-col justify-between">
                      <div class="space-y-0.5">
                        <h4 class="font-bold text-xs text-gray-200">{item.name}</h4>
                        <span class="text-[10px] text-gray-400 block">{item.unit} Pack</span>
                      </div>

                      <div class="flex justify-between items-center pt-1.5">
                        <span class="text-sm font-black text-white">₹{item.price * item.quantity}</span>
                        
                        {/* Incrementor */}
                        <div class="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">
                          <button
                            onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}
                            class="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          >
                            <Minus class="w-3 h-3" />
                          </button>
                          <span class="px-2 text-xs font-bold text-emerald-300">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}
                            class="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          >
                            <Plus class="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Form section */}
            {cartItems.length > 0 && (
              <div class="p-5 border-t border-white/5 bg-darkBg/95 relative z-10 space-y-4">
                {/* Delivery details */}
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest block flex items-center gap-1">
                    <MapPin class="w-3.5 h-3.5 text-violet-400" />
                    10-Min Fast Delivery Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    class="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Enter your address"
                  />
                </div>

                {/* Subtotals detail */}
                <div class="space-y-1.5 border-t border-white/5 pt-3.5 text-xs text-gray-400">
                  <div class="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartSubtotal}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Handling Fee & Tax (5%)</span>
                    <span>₹{Math.round(cartSubtotal * 0.05)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Delivery Charges</span>
                    <span>{cartSubtotal > 99 ? 'FREE' : '₹15'}</span>
                  </div>
                  <div class="flex justify-between text-sm font-extrabold text-white border-t border-white/5 pt-2">
                    <span>Total Amount</span>
                    <span>₹{cartSubtotal + Math.round(cartSubtotal * 0.05) + (cartSubtotal > 99 ? 0 : 15)}</span>
                  </div>
                </div>

                {/* Razorpay instant simulator check button */}
                <button
                  onClick={() => handleCheckout('Razorpay')}
                  disabled={checkoutLoading}
                  class="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-xs tracking-wider uppercase"
                >
                  <CreditCard class="w-4.5 h-4.5" />
                  {checkoutLoading ? 'Processing transaction...' : 'Pay secure via Razorpay'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Translucent Glowing footer */}
      <footer class="py-6 px-6 bg-darkBg/40 border-t border-white/5 text-center text-[10px] text-gray-500 relative z-10">
        <p>© 2026 ZippyMart Systems. Designed pair-programmed premium for recruiters portfolio.</p>
      </footer>
      {/* 6. Change Location Modal */}
      {locationModalOpen && (
        <div class="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div class="w-full max-w-md h-auto glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl relative flex flex-col justify-between overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent pointer-events-none"></div>
            
            {/* Modal Header */}
            <div class="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div class="flex items-center gap-2">
                <MapPin class="w-5.5 h-5.5 text-emerald-400 shrink-0" />
                <h3 class="font-extrabold text-base text-gray-200">Select Delivery Location</h3>
              </div>
              <button 
                onClick={() => setLocationModalOpen(false)} 
                class="text-gray-400 hover:text-white transition-colors"
              >
                <X class="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div class="space-y-5">
              {locationError && (
                <div class="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  ⚠️ {locationError}
                </div>
              )}

              {/* Live Geolocation Button */}
              <button
                onClick={detectLocation}
                disabled={locationLoading}
                class="w-full py-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-500/20 hover:border-emerald-500 hover:text-white text-emerald-400 text-xs font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 tracking-wider uppercase"
              >
                {locationLoading ? (
                  <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <MapPin class="w-4.5 h-4.5" />
                )}
                {locationLoading ? 'Detecting coordinates...' : '🎯 Detect My Current Location'}
              </button>

              <div class="flex items-center justify-between gap-4 text-gray-500 text-xs font-bold">
                <div class="h-px bg-white/5 flex-1"></div>
                <span>OR ENTER MANUALLY</span>
                <div class="h-px bg-white/5 flex-1"></div>
              </div>

              {/* Manual Input */}
              <div class="space-y-2">
                <label class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Delivery Address Details</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="3"
                  class="w-full p-3.5 bg-darkBg/60 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  placeholder="Enter house details, area name, city, state..."
                ></textarea>
              </div>

              {/* Save Address Button */}
              <button
                onClick={() => {
                  if (address.trim().length > 5) {
                    localStorage.setItem('zippymart_address', address);
                    setLocationModalOpen(false);
                  } else {
                    setLocationError("Please enter a valid, complete address (at least 6 characters).");
                  }
                }}
                class="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 text-xs tracking-wider uppercase active:scale-[0.98]"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

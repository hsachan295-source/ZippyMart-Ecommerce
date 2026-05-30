import { configureStore, createSlice } from '@reduxjs/toolkit';

// 1. Auth Slice
const initialUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
const initialToken = localStorage.getItem('token') || null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    loading: false,
    error: null
  },
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    authFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
});

// 2. Cart Slice
const initialCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: initialCart,
  },
  reducers: {
    addToCart: (state, action) => {
      const existing = state.items.find(i => i.productId === action.payload._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          productId: action.payload._id,
          name: action.payload.name,
          price: action.payload.price,
          category: action.payload.category,
          image: action.payload.image,
          unit: action.payload.unit || '1 unit',
          quantity: 1
        });
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(i => i.productId !== action.payload);
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action) => {
      const item = state.items.find(i => i.productId === action.payload.productId);
      if (item) {
        item.quantity = action.payload.quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter(i => i.productId !== action.payload.productId);
        }
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cart');
    }
  }
});

// 3. Product Catalog Slice
const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    categories: [],
    selectedProduct: null,
    recommendations: { similar: [], boughtTogether: [], personalized: [] },
    reviews: [],
    loading: false,
    error: null
  },
  reducers: {
    productsStart: (state) => {
      state.loading = true;
    },
    productsSuccess: (state, action) => {
      state.loading = false;
      state.items = action.payload;
    },
    categoriesSuccess: (state, action) => {
      state.categories = action.payload;
    },
    productDetailSuccess: (state, action) => {
      state.loading = false;
      state.selectedProduct = action.payload.product;
      state.recommendations = action.payload.recommendations;
      state.reviews = action.payload.reviews;
    },
    productsFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addReviewLocal: (state, action) => {
      state.reviews.push(action.payload);
    }
  }
});

// 4. Order Management Slice
const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    myOrders: [],
    activeOrder: null,
    loading: false,
    error: null
  },
  reducers: {
    ordersStart: (state) => {
      state.loading = true;
    },
    ordersSuccess: (state, action) => {
      state.loading = false;
      state.myOrders = action.payload;
    },
    orderDetailSuccess: (state, action) => {
      state.loading = false;
      state.activeOrder = action.payload;
    },
    ordersFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

// 5. ML Insights Slice (For Admin Visuals)
const mlSlice = createSlice({
  name: 'ml',
  initialState: {
    insights: { demandForecast: [], customerSegments: [], sentimentOverview: {} },
    inventory: [],
    analytics: {},
    loading: false
  },
  reducers: {
    mlStart: (state) => {
      state.loading = true;
    },
    insightsSuccess: (state, action) => {
      state.loading = false;
      state.insights = action.payload;
    },
    inventorySuccess: (state, action) => {
      state.loading = false;
      state.inventory = action.payload;
    },
    analyticsSuccess: (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
    }
  }
});

// Export Store Actions
export const { authStart, authSuccess, authFail, logout } = authSlice.actions;
export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export const { productsStart, productsSuccess, categoriesSuccess, productDetailSuccess, productsFail, addReviewLocal } = productSlice.actions;
export const { ordersStart, ordersSuccess, orderDetailSuccess, ordersFail } = orderSlice.actions;
export const { mlStart, insightsSuccess, inventorySuccess, analyticsSuccess } = mlSlice.actions;

// Create Store
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    products: productSlice.reducer,
    orders: orderSlice.reducer,
    ml: mlSlice.reducer
  }
});

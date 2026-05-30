import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productsStart, productsSuccess, productsFail, categoriesSuccess, addToCart, updateQuantity } from '../store/store';
import axios from 'axios';
import { Search, SlidersHorizontal, Star, ShoppingBag, Plus, Minus, Filter, X, Sparkles, Flame, Percent } from 'lucide-react';

export default function Catalog({ setPage, setSelectedProductId }) {
  const dispatch = useDispatch();
  const { items: products, categories, loading } = useSelector((state) => state.products);
  const cartItems = useSelector((state) => state.cart.items);
  const { user } = useSelector((state) => state.auth);

  // Search & Navigation States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sort, setSort] = useState('rating');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Sidebar Filter States
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch categories and products on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/products');
        if (res.data.success) {
          const cats = ['All', ...new Set(res.data.products.map(p => p.category))];
          dispatch(categoriesSuccess(cats));
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    fetchCategories();
  }, [dispatch]);

  // Fetch products with backend filtering
  useEffect(() => {
    const fetchProducts = async () => {
      dispatch(productsStart());
      try {
        const res = await axios.get('/api/products', {
          params: {
            category: selectedCategory,
            search,
            sort,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined
          }
        });
        if (res.data.success) {
          dispatch(productsSuccess(res.data.products));
        }
      } catch (err) {
        dispatch(productsFail(err.response?.data?.message || 'Error loading products'));
      }
    };
    fetchProducts();
  }, [dispatch, selectedCategory, search, sort, minPrice, maxPrice]);

  // Generate Search Suggestions as user types
  useEffect(() => {
    if (search.trim().length > 1 && products.length > 0) {
      const query = search.toLowerCase();
      const matched = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.brand?.toLowerCase().includes(query)
      ).slice(0, 6);
      setSuggestions(matched);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [search, products]);

  // Dynamically extract all brands available in current product list
  const availableBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  // Reset all filters helper
  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setHideOutOfStock(false);
    setSelectedBrands([]);
    setSearch('');
    setSelectedCategory('All');
  };

  // Toggle brand selection helper
  const handleBrandToggle = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(prev => prev.filter(b => b !== brand));
    } else {
      setSelectedBrands(prev => [...prev, brand]);
    }
  };

  // Perform client-side filter aggregations for additional attributes
  const filteredProducts = products.filter(p => {
    // 1. Min Rating Filter
    if (minRating && p.rating < parseFloat(minRating)) return false;
    // 2. Availability Filter
    if (hideOutOfStock && p.stock === 0) return false;
    // 3. Brands Selection Filter
    if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
    return true;
  });

  const getCartQuantity = (prodId) => {
    const found = cartItems.find(i => i.productId === prodId);
    return found ? found.quantity : 0;
  };

  const handleCartAction = (product, action) => {
    const qty = getCartQuantity(product._id);
    if (action === 'add') {
      dispatch(addToCart(product));
    } else if (action === 'increment') {
      dispatch(updateQuantity({ productId: product._id, quantity: qty + 1 }));
    } else if (action === 'decrement') {
      dispatch(updateQuantity({ productId: product._id, quantity: qty - 1 }));
    }
  };

  // Helper to render product card components
  const renderProductCard = (prod) => {
    const qty = getCartQuantity(prod._id);
    return (
      <div key={prod._id} class="glass-panel rounded-3xl overflow-hidden glass-panel-hover flex flex-col justify-between group relative flex-shrink-0 w-44 md:w-56">
        {/* Discount Badge */}
        {prod.discount > 0 && (
          <span class="absolute left-3 top-3 z-10 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold shadow-md shadow-emerald-500/20">
            {prod.discount}% OFF
          </span>
        )}

        {/* Stock Alert */}
        {prod.stock === 0 ? (
          <span class="absolute right-3 top-3 z-10 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold shadow-md shadow-rose-600/20">
            OUT
          </span>
        ) : prod.stock < 15 ? (
          <span class="absolute right-3 top-3 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold shadow-md shadow-amber-500/20">
            FEW LEFT
          </span>
        ) : null}

        {/* Product Image Clickable */}
        <div onClick={() => { setSelectedProductId(prod._id); setPage('product-detail'); }} class="cursor-pointer overflow-hidden aspect-square bg-white/5 relative">
          <img src={prod.image} alt={prod.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div class="absolute inset-0 bg-gradient-to-t from-darkBg/60 to-transparent"></div>
        </div>

        {/* Info Content */}
        <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2">
          <div onClick={() => { setSelectedProductId(prod._id); setPage('product-detail'); }} class="cursor-pointer space-y-1">
            <span class="text-[9px] font-black text-violet-400 uppercase tracking-widest leading-none block">{prod.category}</span>
            <h4 class="font-extrabold text-xs text-gray-100 group-hover:text-emerald-400 transition-colors line-clamp-1">{prod.name}</h4>
            <p class="text-[10px] text-gray-400 line-clamp-1">{prod.description}</p>
            <span class="inline-block text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300 font-bold">{prod.unit}</span>
          </div>

          <div class="flex items-center justify-between gap-1 pt-1">
            <div class="flex flex-col">
              <span class="text-sm font-black text-white">₹{prod.price}</span>
              {prod.originalPrice > prod.price && (
                <span class="text-[10px] text-gray-500 line-through">₹{prod.originalPrice}</span>
              )}
            </div>

            {prod.stock === 0 ? (
              <button disabled class="py-1.5 px-2 bg-white/5 border border-white/5 text-gray-600 text-[10px] font-black rounded-lg">SOLD OUT</button>
            ) : qty > 0 ? (
              <div class="flex items-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg overflow-hidden">
                <button onClick={() => handleCartAction(prod, 'decrement')} class="p-1.5 hover:bg-emerald-500/20 active:scale-95 transition-all"><Minus class="w-3 h-3" /></button>
                <span class="px-2 text-xs font-bold text-emerald-300">{qty}</span>
                <button onClick={() => handleCartAction(prod, 'increment')} class="p-1.5 hover:bg-emerald-500/20 active:scale-95 transition-all"><Plus class="w-3 h-3" /></button>
              </div>
            ) : (
              <button onClick={() => handleCartAction(prod, 'add')} class="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 text-[10px] font-black rounded-lg shadow-md transition-all active:scale-[0.97] flex items-center gap-1">
                <ShoppingBag class="w-3 h-3" /> ADD
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Determine whether to display the structured homepage or standard grid results
  const isSearchActive = search.trim().length > 0 || selectedCategory !== 'All' || minPrice !== '' || maxPrice !== '' || minRating !== '' || hideOutOfStock || selectedBrands.length > 0;

  // Filter lists for homepage showcase segments
  const trendingDeals = products.filter(p => p.discount >= 20).slice(0, 10);
  const bestSellers = products.filter(p => p.rating >= 4.7).slice(0, 10);
  const fruitsShelf = products.filter(p => p.category === 'Fruits').slice(0, 10);
  const vegetablesShelf = products.filter(p => p.category === 'Vegetables').slice(0, 10);
  const electronicsShelf = products.filter(p => p.category === 'Electronics').slice(0, 10);
  const laptopsShelf = products.filter(p => p.category === 'Laptops').slice(0, 10);
  const smartphonesShelf = products.filter(p => p.category === 'Smartphones').slice(0, 10);
  const householdShelf = products.filter(p => p.category === 'Household').slice(0, 10);
  const personalCareShelf = products.filter(p => p.category === 'Personal Care').slice(0, 10);
  const snacksShelf = products.filter(p => p.category === 'Snacks').slice(0, 10);
  const dairyShelf = products.filter(p => p.category === 'Dairy').slice(0, 10);
  const beveragesShelf = products.filter(p => p.category === 'Beverages').slice(0, 10);

  const shelves = [
    { name: 'Fruits', emoji: '🍎', data: fruitsShelf },
    { name: 'Vegetables', emoji: '🥦', data: vegetablesShelf },
    { name: 'Electronics', emoji: '🔌', data: electronicsShelf },
    { name: 'Laptops', emoji: '💻', data: laptopsShelf },
    { name: 'Smartphones', emoji: '📱', data: smartphonesShelf },
    { name: 'Household', emoji: '🧹', data: householdShelf },
    { name: 'Personal Care', emoji: '🧼', data: personalCareShelf },
    { name: 'Snacks', emoji: '🍪', data: snacksShelf },
    { name: 'Dairy', emoji: '🥛', data: dairyShelf },
    { name: 'Beverages', emoji: '🥤', data: beveragesShelf }
  ];

  return (
    <div class="space-y-8 pb-12">
      {/* 1. Header Hero Promo Card */}
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/10 to-violet-500/15 p-6 md:p-8 border border-white/5 shadow-xl">
        <div class="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-emerald-400/20 blur-3xl animate-pulse"></div>
        <div class="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-violet-400/20 blur-3xl animate-pulse"></div>
        
        <div class="max-w-xl space-y-3 relative z-10">
          <span class="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider animate-bounce">
            ZippyMart Superstore ⚡
          </span>
          <h1 class="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Premium Groceries & Electronics <span class="bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent">Directly to You</span>
          </h1>
          <p class="text-gray-300 text-xs md:text-sm leading-relaxed">
            Delivering 530+ premium quality catalog items including organic fresh fruits, crisp farm vegetables, high-end laptops, flagship smartphones, personal care cosmetics, and dairy fresh foods.
          </p>
        </div>
      </div>

      {/* 2. Slideable Category Navigation Row */}
      <div class="space-y-3">
        <h3 class="text-sm font-black text-gray-300 uppercase tracking-widest">Store Departments</h3>
        <div class="flex gap-3.5 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                class={`px-5 py-3 rounded-2xl text-xs font-bold transition-all border flex-shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-darkCard/40 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/10'
                }`}
              >
                {cat === 'All' ? '🏠' : cat === 'Fruits' ? '🍎' : cat === 'Vegetables' ? '🥦' : cat === 'Electronics' ? '🔌' : cat === 'Laptops' ? '💻' : cat === 'Smartphones' ? '📱' : cat === 'Household' ? '🧹' : cat === 'Personal Care' ? '🧼' : cat === 'Snacks' ? '🍪' : cat === 'Dairy' ? '🥛' : cat === 'Beverages' ? '🥤' : '✏️'}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Live Suggestions Bar */}
      <div class="flex gap-3 justify-between items-stretch relative">
        <div class="relative flex-1">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            class="w-full pl-12 pr-4 py-3.5 bg-darkCard/40 border border-white/5 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all text-xs backdrop-blur-md font-medium"
            placeholder="Search 530+ realistic products, categories, or laptop brands..."
          />
          {/* Search Suggestions typeahead Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div class="absolute left-0 right-0 top-14 bg-darkBg/95 backdrop-blur-lg border border-white/10 rounded-2xl z-50 p-2 shadow-2xl space-y-1">
              {suggestions.map((item) => (
                <div 
                  key={item._id}
                  onClick={() => {
                    setSearch(item.name);
                    setSelectedProductId(item._id);
                    setPage('product-detail');
                    setShowSuggestions(false);
                  }}
                  class="p-2.5 hover:bg-white/5 rounded-xl cursor-pointer flex items-center justify-between text-xs text-gray-300 hover:text-white"
                >
                  <div class="flex items-center gap-2">
                    <img src={item.image} alt="" class="w-7 h-7 object-cover rounded-md" />
                    <span class="font-bold">{item.name}</span>
                  </div>
                  <span class="text-[9px] font-black text-violet-400 uppercase tracking-widest">{item.brand}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <button 
          onClick={() => setShowMobileFilters(prev => !prev)}
          class="md:hidden p-3 bg-white/5 border border-white/5 rounded-2xl text-gray-400 flex items-center justify-center active:scale-95"
        >
          <SlidersHorizontal class="w-5 h-5" />
        </button>
      </div>

      {/* 4. Products View Grid Layout (Split Panel) */}
      <div class="flex gap-8 items-start">
        
        {/* Left Column: Filter Sidebar Panel */}
        <aside class={`w-64 shrink-0 glass-panel p-5 rounded-3xl border border-white/5 space-y-6 ${
          showMobileFilters ? 'fixed inset-x-4 top-20 z-40 bg-darkBg/95' : 'hidden md:block'
        }`}>
          <div class="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 class="font-black text-xs text-gray-200 tracking-widest uppercase flex items-center gap-1.5">
              <Filter class="w-4 h-4 text-emerald-400" /> Catalog Filters
            </h3>
            {isSearchActive && (
              <button onClick={handleClearFilters} class="text-[10px] font-black text-rose-400 hover:underline uppercase tracking-wide">
                Clear All
              </button>
            )}
          </div>

          {/* Price Range inputs */}
          <div class="space-y-2">
            <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price Range (₹)</span>
            <div class="flex gap-2 items-center">
              <input 
                type="number" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)} 
                placeholder="Min" 
                class="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
              />
              <span class="text-gray-600 text-xs">-</span>
              <input 
                type="number" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)} 
                placeholder="Max" 
                class="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Min Rating Radio Selectors */}
          <div class="space-y-2">
            <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Rating</span>
            <div class="space-y-1.5">
              {[4.5, 4.0, 3.5].map((stars) => (
                <label key={stars} class="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer hover:text-white">
                  <input 
                    type="radio" 
                    name="rating" 
                    checked={minRating === String(stars)} 
                    onChange={() => setMinRating(String(stars))}
                    class="accent-emerald-500" 
                  />
                  <div class="flex items-center text-amber-400 text-xs gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} class={`w-3.5 h-3.5 ${i < Math.floor(stars) ? 'fill-amber-400' : 'text-gray-600'}`} />
                    ))}
                    <span class="text-gray-400 ml-1">({stars}+)</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Availability checkbox */}
          <label class="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer hover:text-white pt-2 border-t border-white/5">
            <input 
              type="checkbox" 
              checked={hideOutOfStock} 
              onChange={(e) => setHideOutOfStock(e.target.checked)}
              class="accent-emerald-500 rounded" 
            />
            Hide Out of Stock
          </label>

          {/* Dynamic Brands Checkbox list */}
          {availableBrands.length > 0 && (
            <div class="space-y-2 pt-3 border-t border-white/5">
              <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brands</span>
              <div class="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {availableBrands.map((brand) => (
                  <label key={brand} class="flex items-center gap-2 text-xs font-semibold text-gray-400 cursor-pointer hover:text-white">
                    <input 
                      type="checkbox" 
                      checked={selectedBrands.includes(brand)} 
                      onChange={() => handleBrandToggle(brand)}
                      class="accent-emerald-500 rounded" 
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Column: Main Showcase OR Standard Filter Grid results */}
        <section class="flex-1 space-y-12 overflow-hidden">
          
          {loading ? (
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} class="h-80 rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
              ))}
            </div>
          ) : isSearchActive ? (
            // Search / Filter Active Grid view
            <div class="space-y-6">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400 font-bold">Showing {filteredProducts.length} items</span>
                <div class="relative w-48 shrink-0">
                  <select 
                    value={sort} 
                    onChange={(e) => setSort(e.target.value)} 
                    class="w-full pl-4 pr-10 py-2.5 bg-darkCard/40 border border-white/5 rounded-2xl text-white appearance-none focus:outline-none text-xs cursor-pointer font-bold"
                  >
                    <option class="bg-darkBg" value="rating">⭐️ Best Rating</option>
                    <option class="bg-darkBg" value="price_low">💵 Price: Low to High</option>
                    <option class="bg-darkBg" value="price_high">💸 Price: High to Low</option>
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div class="text-center py-16 bg-white/5 rounded-3xl border border-white/5">
                  <p class="text-gray-400 text-sm">No items matches your filter constraints.</p>
                </div>
              ) : (
                <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredProducts.map(renderProductCard)}
                </div>
              )}
            </div>
          ) : (
            // standard homepage showcase shelves (Zepto/Blinkit landing)
            <div class="space-y-12">
              
              {/* Shelf 1: Trending deals row */}
              {trendingDeals.length > 0 && (
                <div class="space-y-4">
                  <div class="flex items-center gap-1.5">
                    <Percent class="w-5 h-5 text-emerald-400 shrink-0" />
                    <h2 class="font-extrabold text-base md:text-lg text-white">Massive Savings (20%+ OFF)</h2>
                  </div>
                  <div class="flex gap-5 overflow-x-auto pb-4 scrollbar-thin">
                    {trendingDeals.map(renderProductCard)}
                  </div>
                </div>
              )}

              {/* Shelf 2: Best Sellers row */}
              {bestSellers.length > 0 && (
                <div class="space-y-4">
                  <div class="flex items-center gap-1.5">
                    <Flame class="w-5 h-5 text-violet-400 shrink-0" />
                    <h2 class="font-extrabold text-base md:text-lg text-white">Best Sellers & Highly Rated</h2>
                  </div>
                  <div class="flex gap-5 overflow-x-auto pb-4 scrollbar-thin">
                    {bestSellers.map(renderProductCard)}
                  </div>
                </div>
              )}

              {/* Loop and draw all 10 custom department shelves dynamically */}
              {shelves.map((shelf) => shelf.data.length > 0 && (
                <div key={shelf.name} class="space-y-4 pt-4 border-t border-white/5">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{shelf.emoji}</span>
                      <h2 class="font-extrabold text-base md:text-lg text-white">{shelf.name} Showcase</h2>
                    </div>
                    <button onClick={() => setSelectedCategory(shelf.name)} class="text-xs text-emerald-400 hover:underline font-bold">See All</button>
                  </div>
                  <div class="flex gap-5 overflow-x-auto pb-4 scrollbar-thin">
                    {shelf.data.map(renderProductCard)}
                  </div>
                </div>
              ))}

            </div>
          )}
        </section>

      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mlStart, insightsSuccess, inventorySuccess, analyticsSuccess } from '../store/store';
import axios from 'axios';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { 
  TrendingUp, BarChart3, Users, AlertOctagon, RefreshCw, 
  PackageCheck, ShoppingBag, ShieldAlert, Sparkles,
  Search, Plus, Edit, Trash2, X, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { insights, inventory, analytics, loading } = useSelector((state) => state.ml);
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  
  // Dashboard navigation tab state
  const [activeTab, setActiveTab] = useState('analytics');

  // Catalog CRUD States
  const [crudProducts, setCrudProducts] = useState([]);
  const [crudLoading, setCrudLoading] = useState(false);
  const [crudSearch, setCrudSearch] = useState('');
  const [crudCategory, setCrudCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Toast feedbacks
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Add/Edit Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null when adding
  const [error, setError] = useState('');
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    category: 'Fruits & Vegetables',
    brand: '',
    price: '',
    originalPrice: '',
    stock: '',
    unit: '1 Unit',
    discount: '0',
    image: ''
  });

  const categoriesList = [
    'Fruits & Vegetables',
    'Dairy & Bakery',
    'Snacks & Biscuits',
    'Beverages',
    'Household Essentials',
    'Personal Care',
    'Baby Care',
    'Electronics',
    'Computer Accessories',
    'Home & Kitchen',
    'Stationery',
    'Pet Care'
  ];

  // Fetch ML Analytics and inventory
  useEffect(() => {
    const fetchAdminData = async () => {
      dispatch(mlStart());
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Node core analytics
        const anaRes = await axios.get('/api/admin/analytics', { headers });
        if (anaRes.data.success) {
          dispatch(analyticsSuccess(anaRes.data.analytics));
        }

        // 2. Fetch inventory statuses
        const invRes = await axios.get('/api/admin/inventory', { headers });
        if (invRes.data.success) {
          dispatch(inventorySuccess(invRes.data.inventory));
        }

        // 3. Fetch FastAPI-level forecasting & segmentations
        const mlRes = await axios.get('/api/admin/ml-insights', { headers });
        if (mlRes.data.success) {
          dispatch(insightsSuccess(mlRes.data));
        }
      } catch (err) {
        console.error('Error fetching admin details:', err);
      }
    };
    fetchAdminData();
  }, [dispatch, triggerRefresh]);

  // Fetch all products for the CRUD list view
  const fetchCrudProducts = async () => {
    setCrudLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/products', { headers });
      if (res.data.success) {
        setCrudProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setErrorMessage('Failed to load catalog products.');
    } finally {
      setCrudLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchCrudProducts();
    }
  }, [activeTab, triggerRefresh]);

  const handleSimulateRestock = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      // Simulated Node API to trigger purchase / stock update
      // For sandbox instant demo, we update products stock directly in our JSON DB
      await axios.post(`/api/products/${productId}/reviews`, {
        rating: 5,
        comment: 'Auto Stock Restock simulator replenishment event.',
        userName: 'System Restock Admin'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // We will perform a refresh
      setTriggerRefresh(p => p + 1);
      setSuccessMessage('Restock simulated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to simulate restock.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Open Form Modals
  const openAddModal = () => {
    setEditingProduct(null);
    setFormValues({
      name: '',
      description: '',
      category: 'Fruits & Vegetables',
      brand: '',
      price: '',
      originalPrice: '',
      stock: '',
      unit: '1 Unit',
      discount: '0',
      image: ''
    });
    setError('');
    setFormOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormValues({
      name: product.name || '',
      description: product.description || '',
      category: product.category || 'Fruits & Vegetables',
      brand: product.brand || '',
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      stock: product.stock !== undefined ? product.stock : '',
      unit: product.unit || '1 Unit',
      discount: product.discount !== undefined ? product.discount : '0',
      image: product.image || ''
    });
    setError('');
    setFormOpen(true);
  };

  // Submit Add / Edit
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!formValues.name.trim()) return setError('Product name is required.');
    if (!formValues.brand.trim()) return setError('Brand is required.');
    if (!formValues.unit.trim()) return setError('Unit size is required.');
    if (!formValues.price || parseFloat(formValues.price) <= 0) return setError('Price must be a positive number.');
    if (formValues.stock === '' || parseInt(formValues.stock) < 0) return setError('Stock quantity cannot be negative.');
    if (!formValues.description.trim()) return setError('Product description is required.');

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const body = {
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        category: formValues.category,
        brand: formValues.brand.trim(),
        price: parseFloat(formValues.price),
        originalPrice: parseFloat(formValues.originalPrice || formValues.price),
        stock: parseInt(formValues.stock),
        unit: formValues.unit.trim(),
        discount: parseInt(formValues.discount || 0),
        image: formValues.image.trim() || undefined
      };

      let res;
      if (editingProduct) {
        // PUT request
        res = await axios.put(`/api/products/${editingProduct._id || editingProduct.id}`, body, { headers });
      } else {
        // POST request
        res = await axios.post('/api/products', body, { headers });
      }

      if (res.data.success) {
        setSuccessMessage(editingProduct ? 'Product details updated successfully!' : 'New product seeded into catalog successfully!');
        setFormOpen(false);
        fetchCrudProducts();
        setTriggerRefresh(p => p + 1); // Refresh ML stats
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(res.data.message || 'Operation failed.');
      }
    } catch (err) {
      console.error('Submit product error:', err);
      setError(err.response?.data?.message || 'Server error saving product details.');
    }
  };

  // Delete product action
  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete "${product.name}" from the catalog? This will also clean its reviews and related records.`)) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.delete(`/api/products/${product._id || product.id}`, { headers });
        if (res.data.success) {
          setSuccessMessage('Product deleted successfully!');
          fetchCrudProducts();
          setTriggerRefresh(p => p + 1); // Refresh ML stats
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setErrorMessage(res.data.message || 'Failed to delete product.');
          setTimeout(() => setErrorMessage(''), 3000);
        }
      } catch (err) {
        console.error('Delete product error:', err);
        setErrorMessage(err.response?.data?.message || 'Server error deleting product.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  // Search & filter matching logic for CRUD
  const filteredProducts = crudProducts.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(crudSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(crudSearch.toLowerCase());
      
    const matchesCategory = 
      crudCategory === 'All' || 
      p.category?.toLowerCase() === crudCategory.toLowerCase();
      
    return matchesSearch && matchesCategory;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts.length, totalPages, currentPage]);

  const COLORS = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b'];
  const criticalInventory = inventory.filter(i => i.stock < 15);

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Page Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-emerald-400" />
            AI Enterprise Dashboard
          </h2>
          <p className="text-gray-400 text-xs mt-1">Real-time demand forecasts, customer clusters, and dynamic pricing metrics.</p>
        </div>

        <button
          onClick={() => setTriggerRefresh(p => p + 1)}
          disabled={loading}
          className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Retrain & Refresh Models
        </button>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="flex border-b border-white/5 pb-1 gap-6">
        <button 
          onClick={() => setActiveTab('analytics')} 
          className={`pb-3 text-xs md:text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'analytics' ? 'text-emerald-400 font-extrabold' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <BarChart3 className="w-4 h-4" />
          📊 ML Analytics & Insights
          {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('catalog')} 
          className={`pb-3 text-xs md:text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'catalog' ? 'text-emerald-400 font-extrabold' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <PackageCheck className="w-4 h-4" />
          📦 ZippyMart Catalog & Inventory Manager
          {activeTab === 'catalog' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />}
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* STAT WIDGETS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Rev widget */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent"></div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Revenue</span>
                <span className="text-lg font-black text-white">₹{analytics.totalRevenue || '0.00'}</span>
              </div>
            </div>

            {/* Orders widget */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent"></div>
              <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Completed Orders</span>
                <span className="text-lg font-black text-white">{analytics.orderCount || '0'}</span>
              </div>
            </div>

            {/* Customers widget */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent"></div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Users</span>
                <span className="text-lg font-black text-white">{analytics.customerCount || '0'}</span>
              </div>
            </div>

            {/* Inventory alert widget */}
            <div className="glass-panel p-5 rounded-3xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent"></div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Inventory Alert</span>
                <span className="text-lg font-black text-white">{criticalInventory.length} Critical Items</span>
              </div>
            </div>
          </div>

          {/* Deep Learning Data Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart 1: Time Series Demand Forecasting */}
            <div className="glass-panel p-5 md:p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-200 text-sm md:text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Demand Forecasting (Weekly Projections)
                </h3>
                <p className="text-[10px] text-gray-400">AI-predicted demand lines mapped alongside actual sales frequencies.</p>
              </div>

              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={insights.demandForecast}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#4b5563" fontSize={11} tickLine={false} />
                    <YAxis stroke="#4b5563" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#121420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Area name="Actual Sales" type="monotone" dataKey="actualSales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" />
                    <Area name="LSTM Forecasted Demand" type="monotone" dataKey="predictedSales" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorPredict)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: K-Means Customer Clustering Segments */}
            <div className="glass-panel p-5 md:p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-200 text-sm md:text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-400" />
                  Customer Segments (K-Means Clustering)
                </h3>
                <p className="text-[10px] text-gray-400">Classified using behavioral spend coordinates in multi-dimensional space.</p>
              </div>

              <div className="h-64 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insights.customerSegments}>
                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} />
                    <YAxis stroke="#4b5563" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#121420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    <Bar name="Segment shopper count" dataKey="count" radius={[10, 10, 0, 0]}>
                      {insights.customerSegments?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Revenue Category Split */}
            <div className="glass-panel p-5 md:p-6 rounded-3xl border border-white/5 space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-gray-200 text-sm md:text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Category Contribution
                </h3>
                <p className="text-[10px] text-gray-400">Percentage total sales split by catalog product category.</p>
              </div>

              <div className="h-64 pt-2 flex items-center justify-center">
                {analytics.categoryPerformance && analytics.categoryPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.categoryPerformance}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {analytics.categoryPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#121420', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-gray-400">Awaiting purchase transactions to chart splits.</span>
                )}
              </div>
            </div>

            {/* Section 4: Customer clusters breakdown explanations */}
            <div className="glass-panel p-5 md:p-6 rounded-3xl border border-white/5 space-y-4">
              <h3 className="font-bold text-gray-200 text-sm">Cluster Profile Insights</h3>
              <div className="space-y-3">
                {insights.customerSegments?.map((seg, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-200 block flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        {seg.name} ({seg.percentage}%)
                      </span>
                      <p className="text-[10px] text-gray-400 leading-normal">{seg.description}</p>
                    </div>
                    <span className="text-xs font-black text-white bg-white/5 px-2.5 py-1 rounded-lg">{seg.count} buyers</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Smart Inventory Replenishment control panel */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-200 text-lg flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                Smart Inventory Prediction & Restock Manager
              </h3>
              <p className="text-xs text-gray-400">Inventory levels mapped against sales trends. Click Restock to simulate suppliers deliveries.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400">
                    <th className="pb-3 font-semibold">Product Name</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Current Stock</th>
                    <th className="pb-3 font-semibold">Inventory Status</th>
                    <th className="pb-3 font-semibold">Risk Score</th>
                    <th className="pb-3 font-semibold text-right">Suggested Replenishment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {inventory.map((item, idx) => {
                    const isCritical = item.stock < 15;
                    const isOut = item.stock === 0;

                    return (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="py-4 font-bold text-gray-200">{item.name}</td>
                        <td className="py-4 text-gray-400">{item.category}</td>
                        <td className="py-4 font-bold text-gray-300">{item.stock} pack</td>
                        <td className="py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                              isOut
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : isCritical
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.status || 'Stable'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`font-bold ${
                              item.riskScore > 70
                                ? 'text-rose-400'
                                : item.riskScore > 30
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {item.riskScore}%
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {isCritical ? (
                            <button
                              onClick={() => handleSimulateRestock(item.productId)}
                              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-extrabold rounded-lg shadow-md hover:shadow-emerald-500/15 transition-all flex items-center gap-1 ml-auto"
                            >
                              Restock +{item.suggestedReorder}
                            </button>
                          ) : (
                            <span className="text-gray-500 text-[10px] italic">No restock needed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* CATALOG & CRUD INVENTORY MANAGER */
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-200 text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                Catalog Products Inventory
              </h3>
              <p className="text-xs text-gray-400">Manage all ZippyMart products, adjust pricing, update descriptions or replenish stock.</p>
            </div>
            
            <button
              onClick={openAddModal}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-emerald-500/10 active:scale-95 self-stretch sm:self-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Add New Product
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="Search name or brand..."
                value={crudSearch}
                onChange={(e) => {
                  setCrudSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium text-xs"
              />
            </div>

            <div>
              <select
                value={crudCategory}
                onChange={(e) => {
                  setCrudCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#0d0f17] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500/50 transition-all font-medium text-xs cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categoriesList.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center text-[11px] text-gray-400 justify-end sm:col-span-2 md:col-span-1">
              Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-400">
                  <th className="pb-3 font-semibold w-12">Image</th>
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Unit</th>
                  <th className="pb-3 font-semibold">Stock Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {crudLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 font-bold">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto mb-2" />
                      Retrieving catalog products list...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400 italic">
                      No matching products found. Try relaxing search filters.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p, idx) => {
                    const isLow = p.stock < 15;
                    const isOut = p.stock === 0;
                    return (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="py-4">
                          <img 
                            src={p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&auto=format&fit=crop&q=60'} 
                            alt={p.name}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&auto=format&fit=crop&q=60' }}
                            className="w-10 h-10 object-cover rounded-lg border border-white/5"
                          />
                        </td>
                        <td className="py-4 font-bold text-gray-200">
                          <div className="font-extrabold text-white text-[13px]">{p.name}</div>
                          <div className="text-[10px] text-gray-400 font-normal">Brand: <span className="font-semibold text-emerald-400">{p.brand || 'Generic'}</span></div>
                        </td>
                        <td className="py-4 text-gray-300 font-medium">{p.category}</td>
                        <td className="py-4 font-bold text-white">
                          <div className="text-[13px]">₹{p.price}</div>
                          {p.originalPrice && p.originalPrice > p.price && (
                            <div className="text-[10px] font-normal text-gray-400 line-through">₹{p.originalPrice}</div>
                          )}
                        </td>
                        <td className="py-4 text-gray-400">{p.unit}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
                            isOut
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {p.stock} units ({isOut ? 'Out of stock' : isLow ? 'Low Stock' : 'Stable'})
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/10 border border-white/5 text-gray-400 hover:text-emerald-400 transition-all active:scale-95"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 border border-white/5 text-gray-400 hover:text-rose-400 transition-all active:scale-95"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || crudLoading}
                className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              
              <span className="text-[10px] font-bold text-gray-400">
                Page <span className="text-white font-extrabold">{currentPage}</span> of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || crudLoading}
                className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Success / Error feedback Toast Notifications */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-2xl text-emerald-400 font-extrabold text-xs flex items-center gap-2 animate-float shadow-xl shadow-emerald-500/5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-rose-500/10 border border-rose-500/20 backdrop-blur-md rounded-2xl text-rose-400 font-extrabold text-xs flex items-center gap-2 animate-float shadow-xl shadow-rose-500/5">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          {errorMessage}
        </div>
      )}

      {/* glassmorphic modal overlays for Add/Edit operations */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 relative border border-white/10">
            <button 
              onClick={() => setFormOpen(false)} 
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                {editingProduct ? 'Edit Product Details' : 'Add New Catalog Product'}
              </h3>
              <p className="text-gray-400 text-xs mt-1">
                {editingProduct ? `Modify product properties for ${editingProduct.name}` : 'Populate properties to seed a new premium product in the catalog.'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-gray-300 font-bold block">Product Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Fresh Organic Blueberries"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-bold block">Category *</label>
                <select
                  value={formValues.category}
                  onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
                  className="w-full bg-[#0d0f17] border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500/50 transition-all font-medium cursor-pointer"
                >
                  {categoriesList.map((cat, idx) => (
                    <option key={idx} value={cat} className="bg-[#0d0f17] text-white">{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-bold block">Brand Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. BioFarm or FreshPick"
                  value={formValues.brand}
                  onChange={(e) => setFormValues({ ...formValues, brand: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-bold block">Unit Size *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 500 g, 1 kg, 1 Unit, 6 Pcs"
                  value={formValues.unit}
                  onChange={(e) => setFormValues({ ...formValues, unit: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-bold block">Price (₹) *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  placeholder="e.g. 199"
                  value={formValues.price}
                  onChange={(e) => setFormValues({ ...formValues, price: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-bold block">Original Price (₹)</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 249 (Defaults to Price if empty)"
                  value={formValues.originalPrice}
                  onChange={(e) => setFormValues({ ...formValues, originalPrice: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-bold block">Discount (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="99"
                  placeholder="e.g. 20 (Auto-calculated if 0)"
                  value={formValues.discount}
                  onChange={(e) => setFormValues({ ...formValues, discount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-300 font-bold block">Stock Quantity *</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  placeholder="e.g. 100"
                  value={formValues.stock}
                  onChange={(e) => setFormValues({ ...formValues, stock: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-gray-300 font-bold block">Product Image URL</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..."
                  value={formValues.image}
                  onChange={(e) => setFormValues({ ...formValues, image: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-gray-300 font-bold block">Product Description *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Write a compelling, realistic product description details..."
                  value={formValues.description}
                  onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all font-medium resize-none"
                />
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="py-2.5 px-5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 font-bold rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-xl transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


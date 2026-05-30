import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productDetailSuccess, productsStart, productsFail, addToCart, updateQuantity, addReviewLocal } from '../store/store';
import axios from 'axios';
import { Star, ArrowLeft, Send, Sparkles, MessageSquare, ThumbsUp, ShoppingBag } from 'lucide-react';

export default function ProductDetail({ productId, setPage, setSelectedProductId }) {
  const dispatch = useDispatch();
  const { selectedProduct: product, recommendations, reviews, loading } = useSelector((state) => state.products);
  const cartItems = useSelector((state) => state.cart.items);
  const { user } = useSelector((state) => state.auth);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState('boughtTogether'); // boughtTogether, similar, personalized
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      dispatch(productsStart());
      try {
        const userId = user?._id || 'anonymous';
        const res = await axios.get(`/api/products/${productId}`, {
          params: { userId }
        });
        if (res.data.success) {
          dispatch(productDetailSuccess({
            product: res.data.product,
            recommendations: res.data.recommendations,
            reviews: res.data.reviews
          }));
        }
      } catch (err) {
        console.error('Error loading product details:', err);
        dispatch(productsFail(err.response?.data?.message || 'Error loading product details'));
      }
    };
    fetchProductDetails();
  }, [dispatch, productId, user]);

  const getCartQuantity = (prodId) => {
    const found = cartItems.find(i => i.productId === prodId);
    return found ? found.quantity : 0;
  };

  const handleCartAction = (prod, action) => {
    const qty = getCartQuantity(prod._id);
    if (action === 'add') {
      dispatch(addToCart(prod));
    } else if (action === 'increment') {
      dispatch(updateQuantity({ productId: prod._id, quantity: qty + 1 }));
    } else if (action === 'decrement') {
      dispatch(updateQuantity({ productId: prod._id, quantity: qty - 1 }));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment) return;
    setReviewError(null);

    try {
      const res = await axios.post(`/api/products/${productId}/reviews`, {
        rating,
        comment,
        userName: user?.name || 'Guest User'
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.data.success) {
        dispatch(addReviewLocal(res.data.review));
        setComment('');
        setRating(5);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Must be logged in to submit product reviews.');
    }
  };

  // Compile overall sentiment summary scores
  const getOverallSentiment = () => {
    if (!reviews || reviews.length === 0) return { label: 'No reviews', color: 'text-gray-400' };
    const positiveCount = reviews.filter(r => r.sentiment === 'Positive').length;
    const negativeCount = reviews.filter(r => r.sentiment === 'Negative').length;
    const ratio = positiveCount / reviews.length;

    if (ratio > 0.6) return { label: 'Highly Positive Sentiment', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (negativeCount / reviews.length > 0.4) return { label: 'Critical Customer Feedback', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    return { label: 'Balanced Customer Feedback', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
  };

  if (loading || !product) {
    return (
      <div class="space-y-6 py-12">
        <div class="h-10 w-24 bg-white/5 animate-pulse rounded-xl"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="h-96 bg-white/5 animate-pulse rounded-3xl"></div>
          <div class="space-y-6">
            <div class="h-12 bg-white/5 animate-pulse rounded-2xl w-3/4"></div>
            <div class="h-6 bg-white/5 animate-pulse rounded-2xl w-1/4"></div>
            <div class="h-24 bg-white/5 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const qty = getCartQuantity(product._id);
  const sentiment = getOverallSentiment();

  return (
    <div class="space-y-12 pb-16">
      {/* Back to Catalog bar */}
      <div>
        <button
          onClick={() => setPage('catalog')}
          class="inline-flex items-center gap-2 px-4 py-2 bg-darkCard/40 border border-white/5 rounded-xl text-sm font-semibold text-gray-300 hover:text-emerald-400 hover:border-emerald-500/20 transition-all backdrop-blur-md"
        >
          <ArrowLeft class="w-4 h-4" />
          Back to Catalog
        </button>
      </div>

      {/* Product Core block */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Product Image */}
        <div class="glass-panel p-4 rounded-3xl border border-white/5 relative overflow-hidden group">
          <div class="absolute inset-0 bg-gradient-to-t from-violet-500/5 to-emerald-500/5 pointer-events-none"></div>
          <img
            src={product.image}
            alt={product.name}
            class="w-full h-80 md:h-96 object-cover rounded-2xl group-hover:scale-[1.01] transition-transform duration-500"
          />
        </div>

        {/* Product Text info */}
        <div class="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
          <div class="space-y-2">
            <span class="inline-block text-[11px] px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold uppercase tracking-wider">
              {product.category}
            </span>
            <h1 class="text-3xl font-extrabold text-white">{product.name}</h1>
            <p class="text-xs text-gray-400">{product.unit} pack</p>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center text-amber-400 bg-amber-400/5 px-3 py-1.5 border border-amber-400/10 rounded-xl text-sm font-bold gap-1">
              <Star class="w-4 h-4 fill-amber-400" />
              {product.rating}
            </div>
            {product.reviewCount > 0 && (
              <span class="text-xs text-gray-400 font-semibold">{product.reviewCount} customer ratings</span>
            )}
          </div>

          <div class="border-t border-white/5 pt-5">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h3>
            <p class="text-sm text-gray-300 leading-relaxed">{product.description}</p>
          </div>

          {/* Pricing Adjustments */}
          <div class="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
            <div class="space-y-1">
              <span class="text-xs text-gray-400 block">Dynamic Pricing optimal rate:</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-white">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <span class="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                )}
              </div>
            </div>

            {qty > 0 ? (
              <div class="flex items-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl overflow-hidden shadow-inner">
                <button onClick={() => handleCartAction(product, 'decrement')} class="p-2.5 hover:bg-emerald-500/20 transition-all">
                  <Star class="w-4 h-1 border-t-2 border-emerald-400 inline-block align-middle" />
                </button>
                <span class="px-3.5 text-sm font-bold text-emerald-300">{qty}</span>
                <button onClick={() => handleCartAction(product, 'increment')} class="p-2.5 hover:bg-emerald-500/20 transition-all">
                  <Star class="w-4 h-4 fill-emerald-400 inline-block align-middle text-[0px]" /> +
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleCartAction(product, 'add')}
                class="py-3 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all flex items-center gap-2 active:scale-[0.98]"
              >
                <ShoppingBag class="w-5 h-5" />
                ADD TO CART
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendation Panel */}
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-violet-400" />
          <h2 class="text-xl font-bold text-white">AI-Powered Recommendations</h2>
        </div>

        {/* Tab selection */}
        <div class="flex border-b border-white/5 gap-2">
          <button
            onClick={() => setActiveTab('boughtTogether')}
            class={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'boughtTogether'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🤝 Frequently Bought Together
          </button>
          <button
            onClick={() => setActiveTab('similar')}
            class={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'similar'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🏷️ Content-Based (Similar)
          </button>
          <button
            onClick={() => setActiveTab('personalized')}
            class={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'personalized'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            💫 Collaborative (Personalized)
          </button>
        </div>

        {/* Recommended Items List */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
          {recommendations[activeTab] && recommendations[activeTab].length > 0 ? (
            recommendations[activeTab].map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  setSelectedProductId(item._id);
                  setPage('product-detail');
                }}
                class="glass-panel p-3.5 rounded-2xl glass-panel-hover cursor-pointer group flex flex-col justify-between"
              >
                <div class="space-y-2">
                  <img src={item.image} alt={item.name} class="w-full h-28 object-cover rounded-xl" />
                  <h4 class="font-bold text-xs text-gray-200 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {item.name}
                  </h4>
                  <p class="text-[10px] text-gray-400">{item.unit}</p>
                </div>
                <div class="flex justify-between items-center pt-2">
                  <span class="text-xs font-bold text-white">₹{item.price}</span>
                  <span class="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Buy
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div class="col-span-4 text-center py-6 bg-white/5 border border-white/5 rounded-2xl">
              <span class="text-gray-400 text-xs">Awaiting collaborative interactions to formulate predictions.</span>
            </div>
          )}
        </div>
      </div>

      {/* NLP Reviews Sentiment panel */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Review list */}
        <div class="md:col-span-2 space-y-5">
          <div class="flex items-center justify-between border-b border-white/5 pb-3">
            <div class="flex items-center gap-2">
              <MessageSquare class="w-5 h-5 text-emerald-400" />
              <h2 class="text-lg font-bold text-white">Customer Reviews</h2>
            </div>
            {/* VADER Sentiment general indicator */}
            <span class={`px-3 py-1 rounded-full text-[10px] border font-black uppercase tracking-wider ${sentiment.color}`}>
              {sentiment.label}
            </span>
          </div>

          <div class="space-y-4">
            {reviews.length === 0 ? (
              <p class="text-gray-400 text-sm py-4 italic">No reviews logged yet. Be the first to analyze!</p>
            ) : (
              reviews.map((rev, index) => (
                <div key={index} class="glass-panel p-4 rounded-2xl border border-white/5 space-y-2 relative">
                  {/* NLP classification display */}
                  <span
                    class={`absolute right-4 top-4 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      rev.sentiment === 'Positive'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : rev.sentiment === 'Negative'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                    }`}
                  >
                    AI: {rev.sentiment}
                  </span>

                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-gray-200">{rev.userName}</span>
                    <div class="flex items-center text-amber-400 text-xs gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} class={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-gray-600'}`} />
                      ))}
                    </div>
                  </div>

                  <p class="text-xs text-gray-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review form */}
        <div class="glass-panel p-6 rounded-3xl border border-white/5 space-y-4 self-start">
          <h3 class="font-bold text-gray-200 text-sm">Write a Product Review</h3>
          <p class="text-xs text-gray-400 leading-relaxed">
            Our natural language models will evaluate sentiment polarities to calibrate recommendations.
          </p>

          {reviewError && (
            <div class="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
              {reviewError}
            </div>
          )}

          <form onSubmit={handleSubmitReview} class="space-y-4">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Rating</label>
              <div class="flex gap-1 text-amber-400 cursor-pointer">
                {[...Array(5)].map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setRating(i + 1)}
                    class="focus:outline-none"
                  >
                    <Star class={`w-6 h-6 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Feedback</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows="3"
                placeholder="Enter review comments (e.g. 'Highly fresh quality ingredients!')"
                class="w-full p-3 bg-darkBg/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-xs"
              ></textarea>
            </div>

            <button
              type="submit"
              class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              <Send class="w-3.5 h-3.5" />
              Analyze Review
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

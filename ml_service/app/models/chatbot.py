import re

class GroceryChatbot:
    def __init__(self):
        # Local KB for structural instant responses
        self.recipes = {
            'breakfast': ['Organic Bananas', 'Full Cream Milk', 'Whole Wheat Bread', 'Fresh Red Apples'],
            'smoothie': ['Organic Bananas', '100% Orange Juice', 'Full Cream Milk'],
            'healthy': ['Organic Bananas', 'Fresh Red Apples', 'Ripe Red Tomatoes', 'Whole Wheat Bread'],
            'salad': ['Ripe Red Tomatoes', 'Organic Bananas', 'Fresh Red Apples'],
            'pizza': ['Grated Mozzarella Cheese', 'Whole Wheat Bread', 'Ripe Red Tomatoes']
        }
        
    def respond(self, query, products=None, order_history=None):
        """
        Interprets user prompt semantic triggers and generates a rich, helpful conversational markdown response.
        If a Gemini API key is configured, this can be piped directly to the LLM model.
        """
        q = query.lower()

        # 1. Order status checks
        if 'order' in q or 'track' in q or 'where' in q:
            if order_history and len(order_history) > 0:
                latest = order_history[0]
                return (
                    f"📦 **Order Status Update**\n\n"
                    f"Your most recent order **{latest.get('_id')}** is currently **{latest.get('deliveryStatus', 'Processing')}**.\n"
                    f"⏱️ **ETA**: Approximately {latest.get('etaMinutes', 10)} minutes.\n"
                    f"💳 **Amount**: ₹{latest.get('totalPrice')} (Paid online via Razorpay).\n\n"
                    f"You can track this live on your order history screen!"
                )
            else:
                return (
                    "🔍 I couldn't find any active orders for your account.\n"
                    "If you recently placed an order, please give it a moment or share the Order ID (e.g. `ord_xxxx`)!"
                )

        # 2. Recipe & Grocery recommendations
        for key, ingredients in self.recipes.items():
            if key in q:
                matched_items = []
                if products:
                    for item_name in ingredients:
                        # Find matching product from live catalog
                        match = next((p for p in products if p['name'] == item_name), None)
                        if match:
                            matched_items.append(match)
                            
                bullets = "\n".join([f"- 🍎 **{item['name']}** (₹{item['price']} per {item.get('unit', 'unit')})" for item in matched_items])
                return (
                    f"🥗 **Smart Kitchen Assistant**\n\n"
                    f"Here is a perfect ingredient list for a **{key.capitalize()}** bundle available in our catalog:\n\n"
                    f"{bullets}\n\n"
                    f"🛒 *Tip: You can add these directly to your cart for a 10-minute lightning delivery!*"
                )

        # 3. Product searches via chatbot
        if 'suggest' in q or 'recommend' in q or 'buy' in q or 'find' in q:
            matches = []
            if products:
                # Find matching categories or items
                for prod in products:
                    if prod['category'].lower() in q or prod['name'].lower() in q or prod['description'].lower() in q:
                        matches.append(prod)
            
            if matches:
                bullets = "\n".join([f"- 🛒 **{p['name']}** (₹{p['price']} | {p['category']})" for p in matches[:4]])
                return (
                    f"👋 **Found fresh items in stock matching your search:**\n\n"
                    f"{bullets}\n\n"
                    f"Would you like me to add any of these to your basket?"
                )
            else:
                return (
                    "Fresh Red Apples 🍎, Full Cream Milk 🥛, Organic Bananas 🍌, and Mozzarella Cheese 🧀 are some of our popular recommendations today!\n"
                    "What category of items are you looking for?"
                )

        # 4. Delivery policy FAQs
        if 'delivery' in q or 'time' in q or 'fast' in q:
            return (
                "⚡ **Superfast 10-Minute Delivery**\n\n"
                "We operate micro-fulfillment warehouses (dark stores) within 2 km of your location to achieve Blinkit/Zepto-level speeds.\n"
                "🛵 **Charge**: FREE delivery for all orders above ₹99! For smaller orders, a minor delivery charge of ₹15 applies."
            )

        if 'refund' in q or 'return' in q or 'cancel' in q:
            return (
                "🛡️ **Hassle-Free Returns & Refunds**\n\n"
                "- **Fresh items (Fruits & Veggies)**: No questions asked instant refund within 2 hours of delivery if quality is not up to mark.\n"
                "- **Packaged items**: Returnable within 24 hours if seal is unbroken.\n"
                "Contact our support team anytime in the dashboard!"
            )

        # Default greeting fallback
        return (
            "Hi there! I am your AI-powered Grocery Assistant ⚡\n\n"
            "I can help you with:\n"
            "- 🔍 **Product Search**: e.g., 'Suggest some organic fruits'\n"
            "- 📦 **Order Tracking**: e.g., 'Where is my order?'\n"
            "- 🥗 **Recipe Plans**: e.g., 'Recipe for a healthy breakfast'\n"
            "- 🛡️ **Policies**: e.g., 'What is your refund policy?'\n\n"
            "What can I grab for you today?"
        )

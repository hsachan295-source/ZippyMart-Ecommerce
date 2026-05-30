class DynamicPricingEngine:
    def __init__(self):
        pass

    def calculate_price(self, base_price, stock, weekly_demand):
        """
        Dynamically adjust prices based on supply (stock) and demand (weekly forecasted sales).
        Rules:
        - Out of stock: No adjustment, or returns base price.
        - Low supply, high demand (stock < 1.5 * weekly_demand): Scarcity premium (+5% to +10%).
        - High supply, low demand (stock > 4.0 * weekly_demand): Overstock discount (up to -20% off).
        - Balanced supply: Standard pricing, or light discount if close to average shelf life.
        """
        if stock == 0:
            return {
                'dynamicPrice': base_price,
                'suggestedDiscount': 0,
                'adjustmentReason': 'Out of stock - standard retail price listed.'
            }

        # Calculate a Supply-to-Demand ratio
        ratio = stock / max(1.0, weekly_demand)

        price_modifier = 0.0
        reason = 'Optimal balance - standard price applied.'

        if ratio < 0.8:
            # High Scarcity Risk: Stock is less than 80% of weekly demand
            price_modifier = 0.08  # 8% scarcity markup
            reason = 'High demand & low inventory - scarcity pricing activated.'
        elif ratio < 1.5:
            # Low Stock warning
            price_modifier = 0.04  # 4% price markup
            reason = 'Strong buying momentum - pricing optimized.'
        elif ratio > 4.5:
            # High Overstock: Stock is 4.5x greater than forecasted weekly sales
            price_modifier = -0.18  # 18% overstock clearance discount
            reason = 'Clearance offer - high inventory levels available!'
        elif ratio > 2.5:
            # Moderate Overstock
            price_modifier = -0.10  # 10% discount
            reason = 'Special deal - inventory volume optimization discount.'

        # Compute dynamic price
        adjusted_price = base_price * (1.0 + price_modifier)
        # Round to nearest integer or 2 decimal places
        dynamic_price = round(max(base_price * 0.75, min(base_price * 1.15, adjusted_price)), 2)
        
        # Calculate discount percentage to show
        discount = 0
        if dynamic_price < base_price:
            discount = int(round((base_price - dynamic_price) / base_price * 100))

        return {
            'dynamicPrice': dynamic_price,
            'suggestedDiscount': discount,
            'adjustmentReason': reason
        }

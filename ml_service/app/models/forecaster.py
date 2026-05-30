import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression

class DemandForecaster:
    def __init__(self):
        self.models = {}
        self.category_seasonality = {
            'Fruits & Vegetables': {0: 1.0, 1: 0.9, 2: 0.95, 3: 1.0, 4: 1.1, 5: 1.3, 6: 1.4}, # Higher on Sat (5), Sun (6)
            'Dairy & Eggs': {0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.05, 5: 1.15, 6: 1.2},
            'Bakery': {0: 1.0, 1: 0.95, 2: 0.95, 3: 1.0, 4: 1.1, 5: 1.25, 6: 1.3},
            'Beverages': {0: 0.9, 1: 0.9, 2: 0.95, 3: 1.0, 4: 1.15, 5: 1.3, 6: 1.35},
            'Snacks & Munchies': {0: 0.85, 1: 0.85, 2: 0.9, 3: 1.0, 4: 1.25, 5: 1.45, 6: 1.5}
        }
        
    def train(self, sales_events):
        """
        Train time series models on historical purchase timestamps.
        Groups transactions by product/category and day, fitting a Linear Regression trend line.
        """
        if not sales_events:
            return
            
        rows = []
        for event in sales_events:
            ts = event.get('timestamp')
            dt = datetime.fromisoformat(ts.replace('Z', '+00:00')).date()
            for item in event.get('items', []):
                rows.append({
                    'date': dt,
                    'productId': item.get('productId'),
                    'category': item.get('category', 'general'),
                    'qty': item.get('quantity', 1)
                })
                
        df = pd.DataFrame(rows)
        if df.empty:
            return
            
        # Group by product and date
        daily_sales = df.groupby(['productId', 'date']).sum().reset_index()
        
        # Fit a model for each active product
        for prod_id, group in daily_sales.groupby('productId'):
            group = group.sort_values('date')
            
            # Convert dates to integer index representing days elapsed
            min_date = group['date'].min()
            group['days_elapsed'] = (group['date'] - min_date).apply(lambda x: x.days)
            
            X = group['days_elapsed'].values.reshape(-1, 1)
            y = group['qty'].values
            
            model = LinearRegression()
            model.fit(X, y)
            
            self.models[prod_id] = {
                'model': model,
                'min_date': min_date,
                'max_days': group['days_elapsed'].max(),
                'avg_qty': group['qty'].mean(),
                'category': group.iloc[0]['category']
            }

    def predict_demand(self, product_id, category, current_stock, days_ahead=7):
        """
        Predict daily sales forecast for the next N days.
        Combines linear trend with day-of-week seasonal multiplier.
        Outputs expected demand, inventory replenishment suggestions, and risk scores.
        """
        now = datetime.now()
        predictions = []
        total_predicted = 0

        # Model exists for this product
        if product_id in self.models:
            info = self.models[product_id]
            model = info['model']
            min_date = info['min_date']
            max_days = info['max_days']
            cat = info['category']
            
            for i in range(1, days_ahead + 1):
                target_date = now + timedelta(days=i)
                days_elapsed = (target_date.date() - min_date).days
                
                # Predict base trend line
                base_pred = model.predict(np.array([[days_elapsed]]))[0]
                base_pred = max(0.1, base_pred) # Non-negative constraint
                
                # Apply day-of-week seasonal index
                dow = target_date.weekday()
                seasonality = self.category_seasonality.get(cat, {}).get(dow, 1.0)
                
                predicted_qty = round(base_pred * seasonality, 2)
                predictions.append({
                    'date': target_date.strftime('%a'),
                    'predictedSales': predicted_qty
                })
                total_predicted += predicted_qty
        else:
            # Fallback heuristic using category mean or a default template if no specific model trained
            base_sales = 5.0 # default baseline daily sales
            for i in range(1, days_ahead + 1):
                target_date = now + timedelta(days=i)
                dow = target_date.weekday()
                seasonality = self.category_seasonality.get(category, {}).get(dow, 1.0)
                predicted_qty = round(base_sales * seasonality, 2)
                predictions.append({
                    'date': target_date.strftime('%a'),
                    'predictedSales': predicted_qty
                })
                total_predicted += predicted_qty

        # Inventory management calculations
        total_predicted = round(total_predicted, 1)
        suggested_reorder = 0
        inventory_risk_score = 0
        
        # Risk of running out of stock based on demand vs current stock
        if current_stock == 0:
            inventory_risk_score = 100
            suggested_reorder = max(30, int(total_predicted * 1.5))
        elif current_stock < total_predicted:
            # If stock is less than predicted weekly demand, high risk
            deficit = total_predicted - current_stock
            inventory_risk_score = min(95, int((deficit / total_predicted) * 100))
            suggested_reorder = int(deficit * 1.5)
        else:
            inventory_risk_score = max(5, int((total_predicted / current_stock) * 15))
            suggested_reorder = 0

        return {
            'forecast': predictions,
            'weeklyDemand': total_predicted,
            'inventoryRiskScore': inventory_risk_score,
            'suggestedReorderQuantity': suggested_reorder,
            'status': 'Restock Required' if inventory_risk_score > 60 else 'Stable'
        }

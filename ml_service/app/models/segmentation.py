import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

class CustomerSegmenter:
    def __init__(self):
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=4, random_state=42, n_init='auto')
        self.is_fitted = False
        
    def segment_customers(self, users, orders):
        """
        Extract behavioral spend vectors per user and fit a K-Means clustering model.
        Classifies into Premium, Budget, Frequent, or Occasional buyers.
        """
        if not users or len(users) < 4:
            # Fallback to structural heuristic segmentation if too few users to cluster
            return self._heuristic_segmentation(users, orders)

        # 1. Feature Engineering
        user_features = {}
        for user in users:
            user_features[user['_id']] = {
                'userId': user['_id'],
                'name': user['name'],
                'totalSpent': 0.0,
                'orderCount': 0,
                'avgOrderValue': 0.0,
                'premiumCategoryItems': 0,
                'totalItemsBought': 0
            }

        premium_categories = ['Dairy & Eggs', 'Beverages', 'Fruits & Vegetables']

        for order in orders:
            user_id = order.get('user')
            if user_id in user_features:
                stats = user_features[user_id]
                stats['orderCount'] += 1
                stats['totalSpent'] += order.get('totalPrice', 0)
                
                for item in order.get('orderItems', []):
                    qty = item.get('quantity', 1)
                    stats['totalItemsBought'] += qty
                    if item.get('category') in premium_categories:
                        stats['premiumCategoryItems'] += qty

        df_rows = []
        for uid, stats in user_features.items():
            if stats['orderCount'] > 0:
                stats['avgOrderValue'] = stats['totalSpent'] / stats['orderCount']
                stats['premiumRatio'] = stats['premiumCategoryItems'] / max(1, stats['totalItemsBought'])
            else:
                stats['avgOrderValue'] = 0.0
                stats['premiumRatio'] = 0.0
            df_rows.append(stats)

        df = pd.DataFrame(df_rows)
        
        # We need at least 4 active records to run clustering safely
        active_users = df[df['orderCount'] > 0]
        if len(active_users) < 4:
            return self._heuristic_segmentation(users, orders)

        # Features to fit: totalSpent, orderCount, avgOrderValue, premiumRatio
        features = active_users[['totalSpent', 'orderCount', 'avgOrderValue', 'premiumRatio']]
        
        # Standardize features
        scaled_features = self.scaler.fit_transform(features)
        
        # Fit KMeans
        self.kmeans.fit(scaled_features)
        labels = self.kmeans.labels_
        self.is_fitted = True

        # Assign tags to clusters based on cluster centroids
        centroids = self.scaler.inverse_transform(self.kmeans.cluster_centers_)
        
        # Map clusters to profiles
        # We sort centroids to identify clusters:
        # Premium: High average value + high premium ratio
        # Budget: Low spend + low premium ratio
        # Frequent: High order count + moderate spend
        # Occasional: Low order count + moderate/high order value
        cluster_mapping = {}
        sorted_indices = sorted(range(4), key=lambda i: centroids[i][0]) # sort by totalSpent
        
        cluster_mapping[sorted_indices[0]] = {
            'name': 'Budget Buyers',
            'desc': 'Price sensitive, lower spend values, prioritize sales and essentials.'
        }
        cluster_mapping[sorted_indices[3]] = {
            'name': 'Premium Buyers',
            'desc': 'Highest total spend, purchases luxury ingredients and fresh categories.'
        }
        
        # Out of the remaining two, check which has higher order frequency
        rem = [sorted_indices[1], sorted_indices[2]]
        if centroids[rem[0]][1] > centroids[rem[1]][1]:
            cluster_mapping[rem[0]] = {
                'name': 'Frequent Buyers',
                'desc': 'High delivery frequencies, stock up small amounts frequently.'
            }
            cluster_mapping[rem[1]] = {
                'name': 'Occasional Buyers',
                'desc': 'Low frequency buyers, place larger single carts occasionally.'
            }
        else:
            cluster_mapping[rem[1]] = {
                'name': 'Frequent Buyers',
                'desc': 'High delivery frequencies, stock up small amounts frequently.'
            }
            cluster_mapping[rem[0]] = {
                'name': 'Occasional Buyers',
                'desc': 'Low frequency buyers, place larger single carts occasionally.'
            }

        # Apply segments
        segmented_users = []
        active_idx = 0
        for _, row in df.iterrows():
            user_data = row.to_dict()
            if row['orderCount'] > 0:
                cluster_lbl = labels[active_idx]
                user_data['segment'] = cluster_mapping[cluster_lbl]['name']
                user_data['description'] = cluster_mapping[cluster_lbl]['desc']
                active_idx += 1
            else:
                user_data['segment'] = 'Occasional Buyers'
                user_data['description'] = 'No orders logged yet. Standard budget/new user profile.'
            segmented_users.append(user_data)

        # Aggregate statistics for Admin Dashboard charts
        counts = pd.DataFrame(segmented_users)['segment'].value_counts()
        total_count = len(segmented_users)
        
        segments_summary = []
        for key, val in cluster_mapping.items():
            name = val['name']
            count = int(counts.get(name, 0))
            percentage = int((count / total_count) * 100) if total_count > 0 else 0
            segments_summary.append({
                'name': name,
                'count': count,
                'percentage': percentage,
                'description': val['desc']
            })

        return {
            'users': segmented_users,
            'summary': segments_summary
        }

    def _heuristic_segmentation(self, users, orders):
        """
        A high-fidelity backup rule-engine that assigns shopper segments based on logical thresholds.
        Ensures perfect execution when transaction history is lean.
        """
        user_features = {}
        for user in users:
            user_features[user['_id']] = {
                'userId': user['_id'],
                'name': user['name'],
                'totalSpent': 0.0,
                'orderCount': 0,
                'avgOrderValue': 0.0,
                'premiumCategoryItems': 0,
                'totalItemsBought': 0
            }

        premium_categories = ['Dairy & Eggs', 'Beverages', 'Fruits & Vegetables']

        for order in orders:
            user_id = order.get('user')
            if user_id in user_features:
                stats = user_features[user_id]
                stats['orderCount'] += 1
                stats['totalSpent'] += order.get('totalPrice', 0)
                for item in order.get('orderItems', []):
                    qty = item.get('quantity', 1)
                    stats['totalItemsBought'] += qty
                    if item.get('category') in premium_categories:
                        stats['premiumCategoryItems'] += qty

        segmented_users = []
        for uid, stats in user_features.items():
            if stats['orderCount'] > 0:
                stats['avgOrderValue'] = stats['totalSpent'] / stats['orderCount']
                stats['premiumRatio'] = stats['premiumCategoryItems'] / max(1, stats['totalItemsBought'])
            else:
                stats['avgOrderValue'] = 0.0
                stats['premiumRatio'] = 0.0

            # Deterministic heuristic mapping
            if stats['totalSpent'] >= 500 or stats['avgOrderValue'] >= 300:
                stats['segment'] = 'Premium Buyers'
                stats['description'] = 'Highest total spend, purchases luxury ingredients and fresh categories.'
            elif stats['orderCount'] >= 3:
                stats['segment'] = 'Frequent Buyers'
                stats['description'] = 'High delivery frequencies, stock up small amounts frequently.'
            elif stats['totalSpent'] > 0 and stats['totalSpent'] < 150:
                stats['segment'] = 'Budget Buyers'
                stats['description'] = 'Price sensitive, lower spend values, prioritize sales and essentials.'
            else:
                stats['segment'] = 'Occasional Buyers'
                stats['description'] = 'Low frequency buyers, place larger single carts occasionally.'
                
            segmented_users.append(stats)

        df = pd.DataFrame(segmented_users)
        counts = df['segment'].value_counts()
        total_count = len(segmented_users)
        
        heuristics_map = {
            'Premium Buyers': 'Highest total spend, purchases luxury ingredients and fresh categories.',
            'Budget Buyers': 'Price sensitive, lower spend values, prioritize sales and essentials.',
            'Frequent Buyers': 'High delivery frequencies, stock up small amounts frequently.',
            'Occasional Buyers': 'Low frequency buyers, place larger single carts occasionally.'
        }
        
        summary = []
        for name, desc in heuristics_map.items():
            count = int(counts.get(name, 0))
            percentage = int((count / total_count) * 100) if total_count > 0 else 0
            summary.append({
                'name': name,
                'count': count,
                'percentage': percentage,
                'description': desc
            })
            
        return {
            'users': segmented_users,
            'summary': summary
        }

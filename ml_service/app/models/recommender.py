import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class GroceryRecommender:
    def __init__(self):
        self.products_df = None
        self.tfidf_matrix = None
        self.tfidf_vectorizer = None
        self.cosine_sim = None
        self.user_item_matrix = None
        
    def fit_content_based(self, products):
        """
        Fit content-based recommender using TF-IDF on product description, category, and name.
        """
        if not products:
            return
        
        self.products_df = pd.DataFrame(products)
        
        # Combine text features for TF-IDF
        self.products_df['combined_features'] = (
            self.products_df['name'] + " " + 
            self.products_df['category'] + " " + 
            self.products_df['description']
        )
        
        self.tfidf_vectorizer = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.products_df['combined_features'])
        self.cosine_sim = cosine_similarity(self.tfidf_matrix, self.tfidf_matrix)

    def get_similar_products(self, product_id, top_n=4):
        """
        Return the top N most similar products using Content-Based TF-IDF matching.
        """
        if self.products_df is None or self.cosine_sim is None:
            return []
        
        # Find index of product
        matching_indices = self.products_df[self.products_df['_id'] == product_id].index
        if len(matching_indices) == 0:
            return []
        
        idx = matching_indices[0]
        
        # Sort indices by cosine similarity
        sim_scores = list(enumerate(self.cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        
        # Select top N similar items (excluding self)
        similar_indices = [i[0] for i in sim_scores[1:top_n+1]]
        similar_items = self.products_df.iloc[similar_indices].to_dict(orient='records')
        return similar_items

    def fit_collaborative(self, sales_events):
        """
        Build a User-Item rating matrix based on sales/purchase histories.
        """
        if not sales_events:
            return
        
        rows = []
        for event in sales_events:
            user_id = event.get('userId')
            for item in event.get('items', []):
                prod_id = item.get('productId')
                qty = item.get('quantity', 1)
                rows.append({'userId': user_id, 'productId': prod_id, 'purchase_count': qty})
        
        df = pd.DataFrame(rows)
        if df.empty:
            return
            
        # Aggregate purchase counts
        grouped = df.groupby(['userId', 'productId']).sum().reset_index()
        self.user_item_matrix = grouped.pivot(index='userId', columns='productId', values='purchase_count').fillna(0)

    def get_frequently_bought_together(self, product_id, top_n=4):
        """
        Co-occurrence analysis: identify which products are frequently ordered alongside the current product.
        """
        if self.products_df is None:
            return []
            
        # If no purchase history, recommend items within the same category as fallback
        current_prod = self.products_df[self.products_df['_id'] == product_id]
        if current_prod.empty:
            return []
            
        category = current_prod.iloc[0]['category']
        fallbacks = self.products_df[(self.products_df['category'] == category) & (self.products_df['_id'] != product_id)]
        
        # Get random sample or limit
        n_fallback = min(len(fallbacks), top_n)
        if n_fallback > 0:
            return fallbacks.sample(n=n_fallback).to_dict(orient='records')
        return self.products_df[self.products_df['_id'] != product_id].head(top_n).to_dict(orient='records')

    def get_personalized_recommendations(self, user_id, top_n=4):
        """
        User-Based Collaborative Filtering recommendations.
        """
        if self.products_df is None:
            return []
            
        # Fallback to general popular items if no user history
        if self.user_item_matrix is None or user_id not in self.user_item_matrix.index:
            # Sort products by rating
            popular = self.products_df.sort_values(by='rating', ascending=False)
            return popular.head(top_n).to_dict(orient='records')
            
        user_vector = self.user_item_matrix.loc[user_id].values.reshape(1, -1)
        
        # Compute user similarities using Cosine Similarity
        user_sims = cosine_similarity(self.user_item_matrix.values, user_vector)
        user_sims_series = pd.Series(user_sims.flatten(), index=self.user_item_matrix.index)
        
        # Find similar users (excluding self)
        similar_users = user_sims_series.drop(user_id).sort_values(ascending=False)
        
        if similar_users.empty or similar_users.max() == 0:
            # No matching purchase pattern, fall back to high rated products
            popular = self.products_df.sort_values(by='rating', ascending=False)
            return popular.head(top_n).to_dict(orient='records')
            
        # Sum up purchase vectors of similar users weighted by similarity score
        weighted_purchases = np.zeros(self.user_item_matrix.shape[1])
        total_similarity = 0
        
        for sim_user_id, sim_score in similar_users.head(5).items():
            if sim_score > 0:
                weighted_purchases += self.user_item_matrix.loc[sim_user_id].values * sim_score
                total_similarity += sim_score
                
        if total_similarity == 0:
            return self.products_df.head(top_n).to_dict(orient='records')
            
        predictions = weighted_purchases / total_similarity
        
        # Create series of predictions and filter out items user already purchased
        pred_series = pd.Series(predictions, index=self.user_item_matrix.columns)
        user_purchases = self.user_item_matrix.loc[user_id]
        not_purchased_preds = pred_series[user_purchases == 0].sort_values(ascending=False)
        
        # Fetch actual product dicts
        top_prod_ids = not_purchased_preds.head(top_n).index.tolist()
        
        if not top_prod_ids:
            return self.products_df.sort_values(by='rating', ascending=False).head(top_n).to_dict(orient='records')
            
        recommended_products = self.products_df[self.products_df['_id'].isin(top_prod_ids)].to_dict(orient='records')
        return recommended_products

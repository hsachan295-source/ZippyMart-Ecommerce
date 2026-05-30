import re

class GrocerySentimentAnalyzer:
    def __init__(self):
        # Weighted dictionary of words relevant to fresh produce & logistics
        self.lexicon = {
            # Positive
            'fresh': 0.4, 'delicious': 0.4, 'tasty': 0.3, 'sweet': 0.2, 'juicy': 0.3,
            'ripe': 0.2, 'fast': 0.3, 'quick': 0.3, 'excellent': 0.5, 'great': 0.3,
            'good': 0.2, 'love': 0.4, 'perfect': 0.5, 'amazing': 0.5, 'friendly': 0.2,
            'clean': 0.2, 'cheap': 0.2, 'affordable': 0.3, 'healthy': 0.3, 'best': 0.4,
            # Negative
            'rotten': -0.5, 'stale': -0.4, 'smelly': -0.3, 'soggy': -0.4, 'bad': -0.3,
            'poor': -0.3, 'worst': -0.5, 'slow': -0.3, 'late': -0.4, 'expensive': -0.2,
            'dirty': -0.3, 'damaged': -0.4, 'expired': -0.5, 'leaked': -0.4, 'moldy': -0.5,
            'sour': -0.2, 'bitter': -0.1, 'disappointed': -0.4, 'waste': -0.4, 'hate': -0.4
        }
        self.negation_words = ['not', 'never', 'no', 'neither', 'hardly', 'barely', 'dont', 'wasnt', 'isnt']
        self.intensifiers = ['very', 'extremely', 'highly', 'super', 'really', 'so']

    def analyze_sentiment(self, text):
        """
        Tokenize input review text, apply negation toggles, intensifiers, and return a compound polarity score.
        Score boundaries are normalized within [-1.0, 1.0].
        """
        if not text or not isinstance(text, str):
            return {'sentiment': 'Neutral', 'score': 0.0}

        # Normalize words
        words = re.findall(r'\b\w+\b', text.lower())
        if not words:
            return {'sentiment': 'Neutral', 'score': 0.0}

        score = 0.0
        negate = False
        negate_counter = 0

        for i, word in enumerate(words):
            # 1. Check for negation
            if word in self.negation_words:
                negate = True
                negate_counter = 3  # Negate next 3 tokens
                continue

            # 2. Check if intensifier
            intensity = 1.0
            if i > 0 and words[i-1] in self.intensifiers:
                intensity = 1.8

            # 3. Score matching words
            if word in self.lexicon:
                word_score = self.lexicon[word] * intensity
                if negate:
                    word_score = -word_score
                score += word_score

            # Decrease negation distance count
            if negate:
                negate_counter -= 1
                if negate_counter <= 0:
                    negate = False

        # Apply sigmoid-like normalization to force score inside [-1, 1]
        # Using a simple hyperbole scale factor
        normalized_score = round(max(-1.0, min(1.0, score / 1.5)), 2)

        # Classification boundary
        if normalized_score > 0.15:
            sentiment = 'Positive'
        elif normalized_score < -0.15:
            sentiment = 'Negative'
        else:
            sentiment = 'Neutral'

        return {
            'sentiment': sentiment,
            'score': normalized_score
        }

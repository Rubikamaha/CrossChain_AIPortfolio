import pandas as pd
import numpy as np
import pickle
import json
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import os

# Intent classes: 
# "swap_exact" - swap X A to B
# "swap_percent" - swap X% A to B
# "swap_usd" - buy $X A

data = [
    # Swap exact
    ("swap 0.5 eth to usdc", "swap_exact"),
    ("exchange 1 bnb for usdt", "swap_exact"),
    ("trade 2.5 matic to usdc", "swap_exact"),
    ("convert 100 usdc to eth", "swap_exact"),
    ("i want to swap 1 eth", "swap_exact"),
    ("swap 2 weth to usdc", "swap_exact"),
    ("trade 500 usdc for eth", "swap_exact"),
    ("sell 3.14 matic", "swap_exact"),
    
    # Swap percent
    ("sell half eth", "swap_percent"),
    ("swap 50% of my bnb", "swap_percent"),
    ("liquidate 25% matic", "swap_percent"),
    ("sell 100% of my eth to usdc", "swap_percent"),
    ("swap all my usdc to eth", "swap_percent"),
    ("convert 10 percent of my portfolio", "swap_percent"),
    ("dump 75% eth", "swap_percent"),
    ("sell half my eth", "swap_percent"),
    
    # Swap USD
    ("buy $1000 usdc", "swap_usd"),
    ("purchase 500 dollars of eth", "swap_usd"),
    ("get $50 worth of bnb", "swap_usd"),
    ("swap for 200 bucks of usdt", "swap_usd"),
    ("buy 100 usdc", "swap_usd"),
    ("invest $2000 in matic", "swap_usd"),
    ("purchase $100 of ethereum", "swap_usd")
]

texts = [item[0] for item in data]
labels = [item[1] for item in data]

# Train
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
    ('clf', LogisticRegression(C=1.0))
])

pipeline.fit(texts, labels)

# Save
model_path = os.path.join(os.path.dirname(__file__), 'intent_model.pkl')
with open(model_path, 'wb') as f:
    pickle.dump(pipeline, f)

print(f"Model trained and saved as {model_path}")

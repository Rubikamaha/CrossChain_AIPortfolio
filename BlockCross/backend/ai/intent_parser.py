import sys
import json
import pickle
import re

import os
def parse_intent(text):
    text = text.lower()
    
    # Load model
    model_path = os.path.join(os.path.dirname(__file__), 'intent_model.pkl')
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
    except Exception as e:
        return {"error": f"Model not found: {str(e)}"}
        
    intent = model.predict([text])[0]
    
    result = {
        "action": "swap",
        "tokenIn": "",
        "tokenOut": "",
        "amountType": "",
        "amountValue": 0
    }
    
    # Map synonyms to symbols
    token_map = {
        "eth": "ETH", "ethereum": "ETH", "weth": "WETH",
        "usdc": "USDC", "usd coin": "USDC",
        "usdt": "USDT", "tether": "USDT",
        "bnb": "BNB", "wbnb": "WBNB",
        "matic": "MATIC", "polygon": "MATIC",
        "dai": "DAI"
    }
    
    found_tokens = []
    for word in text.split():
        if word in token_map:
            found_tokens.append(token_map[word])
            
    # Remove duplicates preserving order
    found_tokens = list(dict.fromkeys(found_tokens))
    
    if len(found_tokens) >= 2:
        if "to" in text.split() or "for" in text.split():
            # Assume tokenIn before "to"/"for", tokenOut after
            idx_to = -1
            if "to" in text.split(): idx_to = text.split().index("to")
            elif "for" in text.split(): idx_to = text.split().index("for")
            
            t_in, t_out = None, None
            for t, word in zip(found_tokens, [k for k in text.split() if k in token_map]):
                if text.split().index(word) < idx_to and not t_in:
                    t_in = t
                elif text.split().index(word) > idx_to and not t_out:
                    t_out = t
            result["tokenIn"] = t_in if t_in else found_tokens[0]
            result["tokenOut"] = t_out if t_out else found_tokens[1]
        else:
            result["tokenIn"] = found_tokens[0]
            result["tokenOut"] = found_tokens[1]
    elif len(found_tokens) == 1:
        if "buy" in text or "purchase" in text or "get" in text:
            result["tokenIn"] = "ETH" 
            result["tokenOut"] = found_tokens[0]
        else:
            result["tokenIn"] = found_tokens[0]
            result["tokenOut"] = "USDC" 
    else:
        result["tokenIn"] = "ETH"
        result["tokenOut"] = "USDC"
        
    # Amount extraction
    if intent == "swap_exact":
        result["amountType"] = "token"
        match = re.search(r'(\d+(?:\.\d+)?)', text)
        if match:
            result["amountValue"] = float(match.group(1))
    
    elif intent == "swap_percent":
        result["amountType"] = "percentage"
        match = re.search(r'(\d+(?:\.\d+)?)%', text)
        if match:
            result["amountValue"] = float(match.group(1))
        elif "half" in text:
            result["amountValue"] = 50.0
        elif "all" in text:
            result["amountValue"] = 100.0
            
    elif intent == "swap_usd":
        result["amountType"] = "usd"
        match = re.search(r'\$(\d+(?:\.\d+)?)', text)
        if not match:
            match = re.search(r'(\d+(?:\.\d+)?)\s*(dollars|bucks)', text)
        if not match and "buy" in text:
             match = re.search(r'buy\s+(\d+(?:\.\d+)?)', text)
        if match:
            result["amountValue"] = float(match.group(1))
            
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        intent_data = parse_intent(query)
        print(json.dumps(intent_data))
    else:
        print(json.dumps({"error": "No input text provided"}))

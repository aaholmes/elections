from scipy.stats import norm
import numpy as np

def calculate_probability(state_data):
    """
    Calculate the probability of winning the electoral college
    based on either direct probabilities or polls with margins.
    """
    total_electoral_votes = 538
    votes_needed = 270
    
    expected_votes = 0
    
    for state, data in state_data.items():
        votes = data['votes']
        
        if 'probability' in data:
            # Quick mode - direct probability
            win_prob = data['probability']
        else:
            # Advanced mode - calculate from polls
            poll = data['poll'] / 100
            margin = data['margin'] / 100
            z_score = (0.5 - poll) / margin
            win_prob = 1 - norm.cdf(z_score)
        
        expected_votes += votes * win_prob
    
    return {
        'probability': round(expected_votes / votes_needed * 100, 1),
        'expected_votes': round(expected_votes, 1)
    }

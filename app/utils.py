from scipy.stats import norm
import numpy as np

def calculate_probability(state_data):
    """
    Calculate the probability of winning the electoral college
    based on state polls and margins of error.
    """
    total_electoral_votes = 538
    votes_needed = 270
    
    # Calculate probability for each state
    expected_votes = 0
    state_probabilities = {}
    
    for state, data in state_data.items():
        poll = data['poll'] / 100  # Convert to decimal
        margin = data['margin'] / 100
        votes = data['votes']
        
        # Calculate probability of winning state using normal distribution
        z_score = (0.5 - poll) / margin
        win_prob = 1 - norm.cdf(z_score)
        
        state_probabilities[state] = win_prob
        expected_votes += votes * win_prob
    
    # For MVP, we'll return a simplified result
    return {
        'probability': round(expected_votes / votes_needed * 100, 1),
        'expected_votes': round(expected_votes, 1)
    }

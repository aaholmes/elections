import numpy as np
from scipy.stats import norm

def calculate_probability(state_data):
    """
    Calculate the probability of winning the electoral college by maintaining
    a full probability distribution of possible electoral vote outcomes.
    """
    # Initialize probability distribution array for 0 to 538 electoral votes
    # pdf[i] represents probability of getting exactly i electoral votes
    pdf = np.zeros(539)
    pdf[0] = 1.0  # Start with certainty of 0 votes
    
    # Process each state
    for state, data in state_data.items():
        votes = data['votes']
        
        # Get win probability for this state
        if 'probability' in data:
            # Quick mode - direct probability
            win_prob = data['probability']
        else:
            # Advanced mode - calculate from polls
            poll = data['poll'] / 100
            margin = data['margin'] / 100
            z_score = (0.5 - poll) / margin
            win_prob = 1 - norm.cdf(z_score)
        
        # Create new PDF incorporating this state's possibilities
        new_pdf = np.zeros(539)
        for i in range(539):
            if i + votes < 539:
                # Probability of winning this state and having i votes already
                new_pdf[i + votes] += pdf[i] * win_prob
            if i < 539:
                # Probability of losing this state and having i votes already
                new_pdf[i] += pdf[i] * (1 - win_prob)
        
        pdf = new_pdf
    
    # Calculate total probability of winning (getting 270 or more votes)
    win_probability = pdf[270:].sum() * 100
    
    # Calculate expected electoral votes
    expected_votes = sum(i * p for i, p in enumerate(pdf))
    
    return {
        'probability': round(win_probability, 1),
        'expected_votes': round(expected_votes, 1),
        'distribution': pdf.tolist()  # Include full distribution for potential visualization
    }

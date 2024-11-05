from flask import Flask, request, jsonify
from scipy.stats import norm
import json

app = Flask(__name__)

def poll_to_win_probability(poll_percentage, margin_of_error):
    mean = poll_percentage / 100
    standard_error = (margin_of_error / 100) / 1.96
    z_score = (0.5 - mean) / standard_error
    win_probability = 1 - norm.cdf(z_score)
    return win_probability

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    results = {}
    total_ev = 538
    dem_win_prob = 1.0

    for state, info in data.items():
        poll = info['poll']
        moe = info['moe']
        ev = info['ev']
        state_win_prob = poll_to_win_probability(poll, moe)
        results[state] = {
            'winProb': state_win_prob,
            'ev': ev
        }
        dem_win_prob *= state_win_prob if ev > 0 else (1 - state_win_prob)
    
    return jsonify({
        'stateResults': results,
        'overallProb': dem_win_prob
    })

if __name__ == '__main__':
    app.run(debug=True)
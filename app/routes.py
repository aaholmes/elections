from flask import Blueprint, render_template, request, jsonify
from app.models import STATE_DATA
from app.utils import calculate_probability

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html', states=STATE_DATA)

@main.route('/calculate', methods=['POST'])
def calculate():
    state_data = {}
    for state_code in STATE_DATA:
        # Check for quick mode input
        quick_prob = request.form.get(f'{state_code}-quick')
        if quick_prob:
            state_data[state_code] = {
                'probability': float(quick_prob),
                'votes': STATE_DATA[state_code]['votes']
            }
        else:
            # Advanced mode
            poll = request.form.get(f'{state_code}-poll')
            margin = request.form.get(f'{state_code}-margin')
            if poll and margin:
                state_data[state_code] = {
                    'poll': float(poll),
                    'margin': float(margin),
                    'votes': STATE_DATA[state_code]['votes']
                }
    
    results = calculate_probability(state_data)
    return render_template('index.html', 
                         states=STATE_DATA, 
                         results=results,
                         distribution=results['distribution'])

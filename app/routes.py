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
        prob_str = request.form.get(f'{state_code}-quick')
        if prob_str:
            try:
                prob = float(prob_str)
                state_data[state_code] = {
                    'probability': prob,
                    'votes': STATE_DATA[state_code]['votes']
                }
            except ValueError:
                print(f"Error with probability for {state_code}: {prob_str}")
    
    results = calculate_probability(state_data)
    return jsonify(results)

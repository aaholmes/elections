from flask import Blueprint, render_template, request, jsonify, send_from_directory
from app.models import STATE_DATA
from app.utils import calculate_probability
import json

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html', state_data=STATE_DATA)

@main.route('/calculate', methods=['POST'])
def calculate():
    # Get probabilities from form data
    state_data = {}
    for state_code, state_info in STATE_DATA.items():
        prob_key = f'{state_code}-quick'
        if prob_key in request.form:
            state_data[state_code] = {
                'votes': state_info['votes'],
                'probability': float(request.form[prob_key])
            }
        else:
            state_data[state_code] = {
                'votes': state_info['votes'],
                'probability': 0.5  # default to 50%
            }

    # Calculate using exact probability method
    result = calculate_probability(state_data)
    
    return jsonify({
        'distribution': result['distribution'],
        'probability': result['probability'],
        'expected_votes': result['expected_votes']
    })

@main.route('/static/data/us-states.json')
def serve_us_states():
    return send_from_directory('static/data', 'us-states.json')

@main.route('/test-map-data')
def test_map_data():
    try:
        with open('app/static/data/us-states.json') as f:
            return jsonify({'success': True, 'message': 'Map data exists'})
    except FileNotFoundError:
        return jsonify({'success': False, 'message': 'Map data file not found'}), 404

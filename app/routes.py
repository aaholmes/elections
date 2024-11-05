from flask import Blueprint, render_template
from app.models import STATE_DATA

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html', states=STATE_DATA)

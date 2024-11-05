from flask import Flask
import os

def create_app():
    app = Flask(__name__, 
                template_folder='templates',
                static_folder='static')
    
    # Import routes after app initialization to avoid circular imports
    from app import routes
    
    # Register blueprints/routes
    app.register_blueprint(routes.main)
    
    return app

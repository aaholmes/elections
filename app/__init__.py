from flask import Flask
from flask_wtf.csrf import CSRFProtect
from config import Config

csrf = CSRFProtect()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.config['WTF_CSRF_ENABLED'] = False  # Disable CSRF for API endpoints
    
    csrf.init_app(app)

    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    return app

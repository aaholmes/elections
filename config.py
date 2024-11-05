import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change'
    STATIC_FOLDER = 'static'
    TEMPLATES_FOLDER = 'templates' 
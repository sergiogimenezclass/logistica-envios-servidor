import os
from flask import Flask
from app.db import init_db
from app.routes.web_routes import web_bp
from app.routes.api_routes import api_bp

def create_app():
    """
    Función Application Factory para instanciar la aplicación Flask,
    inicializar la base de datos y registrar los Blueprints de la arquitectura.
    """
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    template_folder = os.path.join(root_dir, 'templates')
    static_folder = os.path.join(root_dir, 'static')
    
    app = Flask(__name__, template_folder=template_folder, static_folder=static_folder)
    
    # Inicializar la base de datos SQLite y tabla relacional
    init_db()
    
    # Registrar los Blueprints de la aplicación
    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp)
    
    return app

from flask import Blueprint, render_template

# Blueprint para las rutas de la interfaz web
web_bp = Blueprint('web', __name__)

@web_bp.route('/')
def index():
    """Entrega la plantilla principal templates/index.html."""
    return render_template('index.html')

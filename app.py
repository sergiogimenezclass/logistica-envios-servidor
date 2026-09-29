from flask import Flask, render_template

# Inicializar aplicación Flask
app = Flask(__name__)

# Ruta principal: sirve templates/index.html
@app.route('/')
def index():
    return render_template('index.html')

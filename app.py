import os
import sqlite3
from flask import Flask, render_template

# Inicializar aplicación Flask
app = Flask(__name__)

# Configuración de base de datos SQLite
DATABASE = os.path.join(os.path.dirname(__file__), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Ruta principal: sirve templates/index.html
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    print("Servidor Flask inicializado en http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

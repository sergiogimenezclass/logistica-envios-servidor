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

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS envios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tracking_code TEXT UNIQUE NOT NULL,
            recipient TEXT NOT NULL,
            address TEXT NOT NULL,
            status TEXT NOT NULL,
            package_type TEXT,
            pin TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL
        )
    ''')
    
    # Comprobar si la tabla se encuentra vacía para insertar datos semilla
    cursor.execute('SELECT COUNT(*) FROM envios')
    count = cursor.fetchone()[0]
    
    if count == 0:
        seed_shipments = [
            ("AR-1001", "Lucía Fernández", "Av. Corrientes 1350, San Nicolás, CABA", "En camino", "FedEx Express Standard", "4921", -34.6044, -58.3871),
            ("AR-2045", "Martín Benítez", "Av. Colón 1200, Córdoba Capital", "En preparación", "FedEx Box Estándar (2 a 5 kg)", "8104", -31.4135, -64.1952),
            ("AR-3390", "Camila Rossi", "Bv. Oroño 850, Rosario, Santa Fe", "Entregado", "FedEx Envelope (< 1kg)", "1932", -32.9468, -60.6558)
        ]
        cursor.executemany('''
            INSERT INTO envios (tracking_code, recipient, address, status, package_type, pin, lat, lon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_shipments)
    
    conn.commit()
    conn.close()

# Ruta principal: sirve templates/index.html
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    init_db()
    print("Base de datos SQLite inicializada. Servidor en http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

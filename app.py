import os
import sqlite3
from flask import Flask, jsonify, render_template, request

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

# Endpoint API REST: Obtener todos los envíos
@app.route('/api/envios', methods=['GET'])
def get_envios():
    conn = get_db_connection()
    envios = conn.execute('SELECT * FROM envios').fetchall()
    conn.close()
    
    result = []
    for e in envios:
        result.append({
            'id': e['id'],
            'trackingCode': e['tracking_code'],
            'recipient': e['recipient'],
            'address': e['address'],
            'status': e['status'],
            'packageType': e['package_type'],
            'pin': e['pin'],
            'lat': e['lat'],
            'lon': e['lon']
        })
    return jsonify(result), 200

# Endpoint API REST: Obtener un envío por su código de seguimiento (tracking_code)
@app.route('/api/envios/<tracking_code>', methods=['GET'])
def get_envio_by_tracking(tracking_code):
    conn = get_db_connection()
    envio = conn.execute('SELECT * FROM envios WHERE tracking_code = ?', (tracking_code,)).fetchone()
    conn.close()
    
    if envio is None:
        return jsonify({'error': 'Envío no encontrado'}), 404
        
    return jsonify({
        'id': envio['id'],
        'trackingCode': envio['tracking_code'],
        'recipient': envio['recipient'],
        'address': envio['address'],
        'status': envio['status'],
        'packageType': envio['package_type'],
        'pin': envio['pin'],
        'lat': envio['lat'],
        'lon': envio['lon']
    }), 200

# Endpoint API REST: Crear un nuevo envío
@app.route('/api/envios', methods=['POST'])
def create_envio():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON payload requerido'}), 400
        
    tracking_code = data.get('trackingCode')
    recipient = data.get('recipient')
    address = data.get('address')
    status = data.get('status', 'En preparación')
    package_type = data.get('packageType', 'FedEx Express Standard')
    pin = data.get('pin', '0000')
    lat = data.get('lat', -34.6037)
    lon = data.get('lon', -58.3816)
    
    if not tracking_code or not recipient or not address:
        return jsonify({'error': 'Campos obligatorios faltantes'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO envios (tracking_code, recipient, address, status, package_type, pin, lat, lon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (tracking_code, recipient, address, status, package_type, pin, lat, lon))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': new_id,
            'trackingCode': tracking_code,
            'recipient': recipient,
            'address': address,
            'status': status,
            'packageType': package_type,
            'pin': pin,
            'lat': lat,
            'lon': lon
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'El código de seguimiento ya existe'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint API REST: Actualizar un envío existente por ID
@app.route('/api/envios/<int:id>', methods=['PUT'])
def update_envio(id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'JSON payload requerido'}), 400
        
    conn = get_db_connection()
    envio = conn.execute('SELECT * FROM envios WHERE id = ?', (id,)).fetchone()
    if not envio:
        conn.close()
        return jsonify({'error': 'Envío no encontrado'}), 404
        
    tracking_code = data.get('trackingCode', envio['tracking_code'])
    recipient = data.get('recipient', envio['recipient'])
    address = data.get('address', envio['address'])
    status = data.get('status', envio['status'])
    package_type = data.get('packageType', envio['package_type'])
    pin = data.get('pin', envio['pin'])
    lat = data.get('lat', envio['lat'])
    lon = data.get('lon', envio['lon'])
    
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE envios
        SET tracking_code = ?, recipient = ?, address = ?, status = ?, package_type = ?, pin = ?, lat = ?, lon = ?
        WHERE id = ?
    ''', (tracking_code, recipient, address, status, package_type, pin, lat, lon, id))
    conn.commit()
    conn.close()
    
    return jsonify({
        'id': id,
        'trackingCode': tracking_code,
        'recipient': recipient,
        'address': address,
        'status': status,
        'packageType': package_type,
        'pin': pin,
        'lat': lat,
        'lon': lon
    }), 200

if __name__ == '__main__':
    init_db()
    print("Base de datos SQLite inicializada. Servidor en http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

import os
import sqlite3
from flask import Flask, jsonify, render_template, request

# Inicializar aplicación Flask
app = Flask(__name__)

from app.db import get_db_connection, init_db

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

# Endpoint API REST: Eliminar un envío por ID
@app.route('/api/envios/<int:id>', methods=['DELETE'])
def delete_envio(id):
    conn = get_db_connection()
    envio = conn.execute('SELECT * FROM envios WHERE id = ?', (id,)).fetchone()
    if not envio:
        conn.close()
        return jsonify({'error': 'Envío no encontrado'}), 404
        
    conn.execute('DELETE FROM envios WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': f'Envío {id} eliminado correctamente', 'id': id}), 200

if __name__ == '__main__':
    init_db()
    print("Base de datos SQLite inicializada. Servidor en http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)

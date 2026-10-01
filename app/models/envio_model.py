from app.db import get_db_connection

def select_all_envios():
    """Obtiene todos los registros de envíos desde SQLite."""
    conn = get_db_connection()
    envios = conn.execute('SELECT * FROM envios').fetchall()
    conn.close()
    return envios

def select_envio_by_tracking(tracking_code):
    """Busca un envío por su código de seguimiento."""
    conn = get_db_connection()
    envio = conn.execute('SELECT * FROM envios WHERE tracking_code = ?', (tracking_code,)).fetchone()
    conn.close()
    return envio

def select_envio_by_id(envio_id):
    """Busca un envío por su ID interno."""
    conn = get_db_connection()
    envio = conn.execute('SELECT * FROM envios WHERE id = ?', (envio_id,)).fetchone()
    conn.close()
    return envio

def insert_envio(tracking_code, recipient, address, status, package_type, pin, lat, lon):
    """Inserta un nuevo paquete en la base de datos y retorna su nuevo ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO envios (tracking_code, recipient, address, status, package_type, pin, lat, lon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (tracking_code, recipient, address, status, package_type, pin, lat, lon))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def update_envio(envio_id, tracking_code, recipient, address, status, package_type, pin, lat, lon):
    """Actualiza los campos de un envío existente según su ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE envios
        SET tracking_code = ?, recipient = ?, address = ?, status = ?, package_type = ?, pin = ?, lat = ?, lon = ?
        WHERE id = ?
    ''', (tracking_code, recipient, address, status, package_type, pin, lat, lon, envio_id))
    conn.commit()
    conn.close()

def delete_envio(envio_id):
    """Elimina un envío de la base de datos por su ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM envios WHERE id = ?', (envio_id,))
    conn.commit()
    conn.close()

from app.models.envio_model import (
    select_all_envios,
    select_envio_by_tracking,
    select_envio_by_id,
    insert_envio,
    update_envio,
    delete_envio
)

def format_envio_dict(envio_row):
    """Convierte una fila de SQLite (snake_case) a un diccionario en formato camelCase para el cliente."""
    if envio_row is None:
        return None
    return {
        'id': envio_row['id'],
        'trackingCode': envio_row['tracking_code'],
        'recipient': envio_row['recipient'],
        'address': envio_row['address'],
        'status': envio_row['status'],
        'packageType': envio_row['package_type'],
        'pin': envio_row['pin'],
        'lat': envio_row['lat'],
        'lon': envio_row['lon']
    }

def get_all_envios_service():
    rows = select_all_envios()
    return [format_envio_dict(r) for r in rows]

def get_envio_by_tracking_service(tracking_code):
    row = select_envio_by_tracking(tracking_code)
    return format_envio_dict(row)

def get_envio_by_id_service(envio_id):
    row = select_envio_by_id(envio_id)
    return format_envio_dict(row)

def create_envio_service(data):
    if not data:
        raise ValueError("JSON payload requerido")
        
    tracking_code = data.get('trackingCode')
    recipient = data.get('recipient')
    address = data.get('address')
    status = data.get('status', 'En preparación')
    package_type = data.get('packageType', 'FedEx Express Standard')
    pin = data.get('pin', '0000')
    lat = data.get('lat', -34.6037)
    lon = data.get('lon', -58.3816)
    
    if not tracking_code or not recipient or not address:
        raise ValueError("Campos obligatorios faltantes")
        
    # Verificar unicidad
    existing = select_envio_by_tracking(tracking_code)
    if existing:
        raise KeyError("El código de seguimiento ya existe")
        
    new_id = insert_envio(tracking_code, recipient, address, status, package_type, pin, lat, lon)
    return get_envio_by_id_service(new_id)

def update_envio_service(envio_id, data):
    if not data:
        raise ValueError("JSON payload requerido")
        
    existing = select_envio_by_id(envio_id)
    if not existing:
        return None
        
    tracking_code = data.get('trackingCode', existing['tracking_code'])
    recipient = data.get('recipient', existing['recipient'])
    address = data.get('address', existing['address'])
    status = data.get('status', existing['status'])
    package_type = data.get('packageType', existing['package_type'])
    pin = data.get('pin', existing['pin'])
    lat = data.get('lat', existing['lat'])
    lon = data.get('lon', existing['lon'])
    
    update_envio(envio_id, tracking_code, recipient, address, status, package_type, pin, lat, lon)
    return get_envio_by_id_service(envio_id)

def delete_envio_service(envio_id):
    existing = select_envio_by_id(envio_id)
    if not existing:
        return False
    delete_envio(envio_id)
    return True

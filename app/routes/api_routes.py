from flask import Blueprint, jsonify, request
from app.services.envio_service import (
    get_all_envios_service,
    get_envio_by_tracking_service,
    create_envio_service,
    update_envio_service,
    delete_envio_service
)

# Blueprint para la API REST con prefijo /api/envios
api_bp = Blueprint('api', __name__, url_prefix='/api/envios')

# Endpoint API REST: Obtener todos los envíos
@api_bp.route('', methods=['GET'])
def get_envios():
    envios = get_all_envios_service()
    return jsonify(envios), 200

# Endpoint API REST: Obtener un envío por su código de seguimiento
@api_bp.route('/<tracking_code>', methods=['GET'])
def get_envio_by_tracking(tracking_code):
    envio = get_envio_by_tracking_service(tracking_code)
    if envio is None:
        return jsonify({'error': 'Envío no encontrado'}), 404
    return jsonify(envio), 200

# Endpoint API REST: Crear un nuevo envío
@api_bp.route('', methods=['POST'])
def create_envio():
    data = request.get_json()
    try:
        created = create_envio_service(data)
        return jsonify(created), 201
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except KeyError as ke:
        return jsonify({'error': str(ke).strip("'")}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint API REST: Actualizar un envío por ID
@api_bp.route('/<int:id>', methods=['PUT'])
def update_envio(id):
    data = request.get_json()
    try:
        updated = update_envio_service(id, data)
        if updated is None:
            return jsonify({'error': 'Envío no encontrado'}), 404
        return jsonify(updated), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint API REST: Eliminar un envío por ID
@api_bp.route('/<int:id>', methods=['DELETE'])
def delete_envio(id):
    success = delete_envio_service(id)
    if not success:
        return jsonify({'error': 'Envío no encontrado'}), 404
    return jsonify({'message': f'Envío {id} eliminado correctamente', 'id': id}), 200

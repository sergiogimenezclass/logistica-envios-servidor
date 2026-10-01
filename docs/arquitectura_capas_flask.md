# Arquitectura por Capas en Flask — LogiTrack Express

Este documento registra el proceso de refactorización y diseño de la arquitectura en capas aplicada sobre el backend Python Flask del proyecto **LogiTrack Express**.

---

## 🏛️ Motivación y Objetivos
Inicialmente, la aplicación concentraba toda la lógica en un único archivo (`app.py`), mezclando:
- Inicialización y conexión a la base de datos SQLite.
- Sentencias SQL puras (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
- Reglas de negocio y formateo de respuestas JSON.
- Definición de rutas HTTP y renderizado de plantillas web.

El objetivo de la refactorización es aplicar el principio de **Separación de Responsabilidades (SoC - Separation of Concerns)** mediante una **Arquitectura en Capas** modularizada con **Blueprints** y el patrón **Application Factory**.

---

## 📂 Estructura de Directorios

```text
logistica-envios-servidor/
├── app/
│   ├── __init__.py           # Application Factory (create_app)
│   ├── db.py                 # Capa 1: Gestión de Base de Datos SQLite
│   ├── models/               # Capa 2: Acceso a Datos (SQL)
│   │   └── envio_model.py
│   ├── services/             # Capa 3: Lógica de Negocio y Formateo
│   │   └── envio_service.py
│   └── routes/               # Capa 4: Controladores / Endpoints (Blueprints)
│       ├── web_routes.py
│       └── api_routes.py
├── docs/                     # Documentación técnica del proyecto
│   └── arquitectura_capas_flask.md
├── run.py                    # Punto de entrada ejecutable
├── app.py                    # Wrapper compatible
├── database.db               # Base de datos SQLite
├── static/                   # CSS, JS, activos del cliente
└── templates/                # Plantillas HTML (index.html)
```

---

## 🛠️ Detalle de las Capas

### 1. Capa de Base de Datos (`app/db.py`)
- **Función**: Gestionar la ruta del archivo `database.db`, proveer la función `get_db_connection()` con `sqlite3.Row` y ejecutar la siembra inicial `init_db()`.
- **Ventaja**: Aísla el driver SQLite y la configuración de persistencia del resto de la aplicación.

### 2. Capa de Acceso a Datos (`app/models/envio_model.py`)
- **Función**: Contiene las funciones SQL puras (`select_all_envios`, `select_envio_by_tracking`, `insert_envio`, `update_envio`, `delete_envio`).
- **Ventaja**: Ninguna otra capa interactúa directamente con SQL ni conoce la estructura de las tablas.

### 3. Capa de Lógica de Negocio (`app/services/envio_service.py`)
- **Función**: Mapear registros `sqlite3.Row` (`snake_case`) a objetos/diccionarios cliente (`camelCase`), ejecutar validaciones de negocio y manejar errores lógicos.
- **Ventaja**: Permite reutilizar la lógica de negocio sin duplicarla entre controladores web o APIs REST.

### 4. Capa de Controladores / Rutas (`app/routes/`)
- **`web_routes.py`**: Define el `web_bp` para la entrega de la vista HTML principal (`GET /`).
- **`api_routes.py`**: Define el `api_bp` (`/api/envios`) para los verbos REST (`GET`, `POST`, `PUT`, `DELETE`).
- **Ventaja**: Agrupa endpoints por dominio usando **Blueprints** de Flask.

### 5. Application Factory Pattern (`app/__init__.py`)
- **Función**: Provee la función `create_app()` que instancia Flask, inicializa la DB y registra los Blueprints.
- **Ventaja**: Previene problemas de importación circular (*circular imports*) y simplifica el entorno de pruebas.

---

## 📊 Beneficios Obtenidos
1. **Mantenibilidad**: Código limpio y fácil de navegar.
2. **Escalabilidad**: Posibilidad de cambiar el ORM/BD o agregar nuevas entidades sin reescribir controladores.
3. **Testabilidad**: Cada capa se puede probar de forma independiente mediante mocks o bases de datos de prueba.

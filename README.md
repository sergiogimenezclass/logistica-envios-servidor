# 🚚 LogiTrack Express — Fase 2: Backend RESTful con Python, Flask y SQLite

¡Bienvenido a la **Fase 2** de LogiTrack Express! En esta etapa, el proyecto evoluciona de un prototipo 100% frontend a una **aplicación web full-stack desacoplada**, migrando la persistencia de datos desde `localStorage` hacia un backend robusto construido con **Python**, **Flask** y una base de datos relacional **SQLite**.

---

## 🎯 Objetivos de la Fase 2

1. **Servidor Backend en Python:** Crear y configurar un servidor con el microframework **Flask** (`app.py`).
2. **Base de Datos Relacional SQLite:** Diseñar e implementar el esquema de datos relacional en `database.db` (tabla `envios`).
3. **Endpoints API RESTful:** Exponer la API REST para operaciones CRUD y consultas del sistema.
4. **Desacoplamiento e Integración:** Refactorizar la capa cliente (`app.js`) para reemplazar `localStorage` por consumo asíncrono (`fetch`) hacia los endpoints de Flask.

---

## 🛠️ Stack Tecnológico (Fase 2)

- **Lenguaje Backend:** Python 3.x
- **Framework Web:** Flask (y Flask-CORS para soporte multi-origen)
- **Base de Datos:** SQLite 3 (`database.db` / módulo `sqlite3`)
- **Frontend Existente:** HTML5, CSS3 Vainilla y JavaScript ES6+
- **APIs Externas Integradas:**
  - OpenStreetMap Nominatim (Geocodificación)
  - OSRM Routing Engine (Cálculo de rutas viales)
  - QR Server API (Generación de códigos QR)

---

## 📡 Especificación de la API REST (`/api/envios`)

| Método | Endpoint | Descripción | Cuerpo de Petición (JSON) |
| --- | --- | --- | --- |
| `GET` | `/api/envios` | Obtiene el listado completo de envíos | N/A |
| `GET` | `/api/envios/<tracking_code>` | Consulta un envío específico por su código de guía | N/A |
| `POST` | `/api/envios` | Crea un nuevo envío en la base de datos | `{ trackingCode, recipient, address, packageType, status, pin, lat, lon }` |
| `PUT` | `/api/envios/<id>` | Actualiza el estado o información de un envío existente | `{ status, recipient, address, ... }` |
| `DELETE` | `/api/envios/<id>` | Elimina un envío de la base de datos por ID | N/A |

---

## 🗄️ Esquema de la Base de Datos SQLite (`database.db`)

### Tabla: `envios`

| Columna | Tipo SQL | Descripción |
| --- | --- | --- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Identificador único del registro |
| `tracking_code` | `TEXT UNIQUE NOT NULL` | Código único de seguimiento (ej. `AR-1001`) |
| `recipient` | `TEXT NOT NULL` | Nombre del destinatario |
| `address` | `TEXT NOT NULL` | Dirección de entrega normalizada |
| `status` | `TEXT NOT NULL` | Estado operativo (`En preparación`, `En camino`, `Entregado`) |
| `package_type` | `TEXT` | Tipo de servicio / paquete |
| `pin` | `TEXT NOT NULL` | PIN secreto de 4 dígitos para entrega |
| `lat` | `REAL NOT NULL` | Coordenada de latitud |
| `lon` | `REAL NOT NULL` | Coordenada de longitud |

---

## 📁 Estructura de Archivos (Fase 2 Backend)

```text
logistica-envios-servidor/
├── app.py           # Servidor principal Flask y definición de rutas de la API REST
├── database.db      # Base de datos relacional SQLite (se crea automáticamente)
├── index.html       # Interfaz gráfica cliente (servida por Flask o de forma desacoplada)
├── styles.css       # Hoja de estilos de la interfaz
├── app.js           # Lógica cliente refactorizada para consumir /api/envios
├── contexto.md      # Especificación técnica y documento de traspaso
└── README.md        # Documentación de la Fase 2 (Backend & API REST)
```


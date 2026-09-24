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

---

## 🤖 Guía Didáctica: Prompts Paso a Paso para la Fase 2 (Flask + SQLite)

A continuación tenés la secuencia ordenada de **prompts** para construir y migrar el backend en Python con Flask y SQLite de forma pedagógica.

---

### 🔹 Paso 1: Configuración del Entorno y Servidor Flask Base

> **Prompt 1:**
> "Crea el archivo `app.py` configurando un servidor Flask básico. Configura Flask para servir el archivo `index.html` y los recursos estáticos (`styles.css` y `app.js`). Habilita CORS si es necesario y verifica que el servidor responda correctamente en `http://localhost:5000/`."

---

### 🔹 Paso 2: Inicialización de la Base de Datos SQLite y Datos Semilla

> **Prompt 2:**
> "En `app.py`, implementa la conexión a SQLite utilizando la librería nativa `sqlite3`. Escribe la función `init_db()` que cree la tabla `envios` si no existe con las columnas `id`, `tracking_code`, `recipient`, `address`, `status`, `package_type`, `pin`, `lat` y `lon`. Si la tabla se encuentra vacía, inserta automáticamente un conjunto de envíos semilla de prueba."

---

### 🔹 Paso 3: Endpoints RESTful de Lectura (`GET /api/envios` y `GET /api/envios/<tracking_code>`)

> **Prompt 3:**
> "Agrega en `app.py` los endpoints de lectura:
> 1. `GET /api/envios`: Consulta todos los registros de la tabla `envios` y devuélvelos en formato JSON.
> 2. `GET /api/envios/<tracking_code>`: Busca un envío por su código de seguimiento y devuelve sus datos en JSON. Si no existe, retorna un error 404 con un mensaje adecuado."

---

### 🔹 Paso 4: Endpoint RESTful para Registro de Envíos (`POST /api/envios`)

> **Prompt 4:**
> "Implementa en `app.py` el endpoint `POST /api/envios`. Debe recibir los datos de un nuevo paquete en formato JSON (`trackingCode`, `recipient`, `address`, `status`, `packageType`, `pin`, `lat`, `lon`), validarlos e insertarlos en la tabla `envios` de SQLite. Retorna el nuevo registro creado junto con un código de estado HTTP 201."

---

### 🔹 Paso 5: Endpoints RESTful para Edición y Eliminación (`PUT` y `DELETE`)

> **Prompt 5:**
> "Agrega en `app.py` los endpoints operativos faltantes:
> 1. `PUT /api/envios/<int:id>`: Recibe los campos a actualizar de un envío y ejecuta la sentencia `UPDATE` correspondiente en SQLite.
> 2. `DELETE /api/envios/<int:id>`: Elimina el registro del envío correspondiente según su ID de la base de datos."

---

### 🔹 Paso 6: Refactorización de Frontend (`app.js`) para Consumir la API REST

> **Prompt 6:**
> "En `app.js`, reemplaza todas las funciones que leen y escriben en `localStorage` por peticiones asíncronas `fetch` dirigidas a los endpoints de la API Flask (`/api/envios`). Actualiza las funciones de carga de tabla, búsqueda de seguimiento, guardado en formulario, cambio de estado a 'Entregado' y eliminación para que interactúen en tiempo real con el servidor Python."

---

### 🔹 Paso 7: Verificación y Pruebas del Sistema Full-Stack

> **Prompt 7:**
> "Revisa el flujo completo entre el frontend (`index.html`, `app.js`) y el backend (`app.py` con SQLite). Asegúrate de que los cambios de estado (como la validación del PIN al 100% de la ruta) se persistan en SQLite y que la planilla de operador refleje inmediatamente las altas, modificaciones y bajas realizadas en la base de datos."

---

## 💡 Recomendaciones Didácticas

1. **Ejecución del Servidor:** Iniciá el backend ejecutando `python app.py` en tu terminal.
2. **Pruebas de la API:** Podés probar los endpoints REST utilizando cURL, Postman o la consola del navegador.
3. **Persistencia Real:** A diferencia de `localStorage`, los datos creados o modificados se conservarán en el archivo `database.db`.

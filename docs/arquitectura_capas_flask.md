# Arquitectura por Capas en Flask — Guía Pedagógica y Estructural

Este documento explica de forma conceptual y práctica la **Arquitectura en Capas** implementada en la aplicación **LogiTrack Express**, detallando el rol, la responsabilidad y la justificación técnica de cada componente.

---

## 💡 ¿Por qué trabajar en capas? (Separación de Responsabilidades)

En el desarrollo de software, mezclar la conexión a la base de datos, las consultas SQL, las reglas de negocio y los endpoints en un solo archivo (como `app.py`) crea lo que se conoce como **"Código Espagueti"** o **"Monolito en Archivo Único"**. 

La **Arquitectura en Capas** propone organizar el código según el principio de **Separación de Responsabilidades (SoC)**: cada módulo tiene un único trabajo bien definido y solo interactúa con las capas inmediatamente adyacentes.

---

## 🏛️ Mapa de la Arquitectura y Flujo de Datos

```text
[ Cliente (Navegador / Frontend JS) ]
               │  ▲
   Petición    │  │  Respuesta JSON / HTML
      HTTP     ▼  │
┌──────────────────────────────────────────────────┐
│  CAPA 4: Controladores y Rutas (Blueprints)      │  <-- app/routes/
│  (Recibe la HTTP Request y emite la HTTP Response)│
└────────────────────────┬─────────────────────────┘
                         │ 
                         ▼
┌──────────────────────────────────────────────────┐
│  CAPA 3: Servicios y Lógica de Negocio           │  <-- app/services/
│  (Valida datos, aplica reglas y mapea formatos)  │
└────────────────────────┬─────────────────────────┘
                         │ 
                         ▼
┌──────────────────────────────────────────────────┐
│  CAPA 2: Acceso a Datos / Modelos                │  <-- app/models/
│  (Ejecuta sentencias SQL puras contra la DB)      │
└────────────────────────┬─────────────────────────┘
                         │ 
                         ▼
┌──────────────────────────────────────────────────┐
│  CAPA 1: Configuración de Base de Datos           │  <-- app/db.py
│  (Maneja conexiones físicas SQLite e init_db)    │
└──────────────────────────────────────────────────┘
```

---

## 📚 Explicación Pedagógica de cada Capa

### 1️⃣ Capa de Base de Datos (`app/db.py`)
* **¿Qué es?**: La infraestructura base encargada de comunicarse físicamente con el motor de base de datos (SQLite).
* **Analogía**: Es el **electricista / plomero** del edificio: se encarga de los caños y la infraestructura de conexión física.
* **Responsabilidad Única**: 
  - Abrir y cerrar conexiones a `database.db` (`get_db_connection()`).
  - Asegurar la creación inicial de tablas y registros semilla (`init_db()`).
* **¿Por qué existe?**: Si el día de mañana se cambia de SQLite a PostgreSQL o MySQL, solo se modifica este archivo de infraestructura sin alterar la lógica de negocio ni las rutas.

---

### 2️⃣ Capa de Acceso a Datos / Modelos (`app/models/envio_model.py`)
* **¿What is? / ¿Qué es?**: El módulo que traduce las operaciones sobre objetos hacia lenguaje **SQL puras** (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
* **Analogía**: Es el **archivista de un depósito**: conoce exactamente en qué estante guardar o buscar una carpeta física (registros en las filas de las tablas).
* **Responsabilidad Única**:
  - Ejecutar `SELECT * FROM envios` o `INSERT INTO envios ...`.
  - Retornar filas puras de la base de datos (`sqlite3.Row`).
* **Regla de Oro**: Esta capa **nunca** debe enterarse de qué es una petición HTTP ni de qué formato necesita el cliente web en el navegador.

---

### 3️⃣ Capa de Servicios y Lógica de Negocio (`app/services/envio_service.py`)
* **¿Qué es?**: El "cerebro" u organizador central de la aplicación.
* **Analogía**: Es el **gerente de operaciones**: recibe la solicitud, verifica si se cumplen las políticas del negocio (campos obligatorios, unicidad de código, PIN válido) y le ordena al archivista (Model) lo que debe hacer.
* **Responsabilidad Única**:
  - Mapear nombres de columnas de base de datos (`snake_case` como `tracking_code`) a las propiedades que espera el frontend en JavaScript (`camelCase` como `trackingCode`).
  - Validar reglas operativas (ej. verificar si un código de seguimiento ya existe antes de crearlo).
  - Lanzar excepciones o devolver errores de negocio claros.
* **Regla de Oro**: Los servicios son completamente independientes del framework web. No saben lo que es un `request` ni un `jsonify`.

---

### 4️⃣ Capa de Controladores y Rutas (`app/routes/`)
* **¿Qué es?**: La cara visible de la API REST y el servidor web.
* **Analogía**: Es la **recepcionista / mozo** de un restaurante: recibe el pedido del cliente (Petición HTTP), se lo entrega al cocinero (Servicio) y cuando la comida está lista la sirve en el plato adecuado (Respuesta JSON o página HTML).
* **Componentes**:
  - **`web_routes.py`**: Sirve páginas web HTML (`render_template`).
  - **`api_routes.py`**: Procesa verbos HTTP (`GET`, `POST`, `PUT`, `DELETE`) y responde objetos JSON (`jsonify`).
* **Herramienta clave (Blueprints)**: Permite dividir las rutas del sistema en carpetas o módulos independientes sin acumular cientos de líneas en `app.py`.

---

### 5️⃣ Capa de Ensamblado: Application Factory (`app/__init__.py`)
* **¿Qué es?**: La función creadora (`create_app()`) que pone a funcionar todas las piezas juntas cuando arranca el servidor.
* **Analogía**: Es la **llave de encendido del auto**: al girarla, arranca el motor, conecta el tablero y activa la radio.
* **Responsabilidad Única**:
  - Instanciar la aplicación Flask (`Flask(__name__)`).
  - Ejecutar la inicialización de la base de datos.
  - Registrar los Blueprints (`web_bp` y `api_bp`).
* **Ventaja técnica**: Previene el problema clásico de importaciones circulares (*circular import errors*) en Python.

---

## 📋 Resumen de Responsabilidades

| Capa | Archivo | Recibe | Devuelve | Rol Principal |
| :--- | :--- | :--- | :--- | :--- |
| **Infraestructura** | `app/db.py` | Parámetros de conexión | Objeto `sqlite3.Connection` | Gestiona el archivo `.db` y DDL inicial. |
| **Modelo** | `app/models/envio_model.py` | Variables / Filtros | Filas de BD (`sqlite3.Row`) | Ejecuta sentencias SQL puras. |
| **Servicio** | `app/services/envio_service.py` | DTOs / Diccionarios | Diccionarios `camelCase` o Excepciones | Aplica reglas de negocio y transforma datos. |
| **Controlador** | `app/routes/api_routes.py` | Petición HTTP (`request`) | Respuesta HTTP (`jsonify`, Status Code) | Atiende la comunicación con el cliente web. |
| **Factory** | `app/__init__.py` | Configuración | Aplicación Flask armada | Inicializa y ensambla toda la arquitectura. |

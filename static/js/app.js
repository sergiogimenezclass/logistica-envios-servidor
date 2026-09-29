// ============================================================================
// LOGITRACK EXPRESS — FASE 2: CONSUMO DE API RESTFUL FLASK
// ============================================================================

// Variable de estado global para los envíos obtenidos del backend
let shipments = [];

/**
 * Petición asíncrona para obtener la lista de envíos desde la API Flask (/api/envios)
 */
async function fetchShipments() {
    try {
        const response = await fetch('/api/envios');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        shipments = await response.json();
        console.log("Envíos cargados desde la API REST Flask:", shipments);
        return shipments;
    } catch (error) {
        console.error("Error al consultar /api/envios:", error);
        return [];
    }
}

// Inicialización básica al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    fetchShipments();
});

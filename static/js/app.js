// ============================================================================
// LOGITRACK EXPRESS — FASE 2: CONSUMO DE API RESTFUL FLASK
// ============================================================================

// Variable de estado global para los envíos obtenidos del backend
let shipments = [];

// Variables de estado del mapa Leaflet
let map = null;
let markersLayer = null;

// Elementos del DOM de Navegación y Vistas
const tabClient = document.getElementById("tab-client");
const tabOperator = document.getElementById("tab-operator");
const viewClient = document.getElementById("view-client");
const viewOperator = document.getElementById("view-operator");

// Elementos del Portal de Cliente
const searchInput = document.getElementById("search-tracking-input");
const btnSearch = document.getElementById("btn-search-tracking");

// Elementos del DOM del Operador
const tableBody = document.getElementById("shipments-table-body");
const counterBadge = document.getElementById("counter-badge");

// Métricas de Control del Operador
const statTotal = document.getElementById("stat-total");
const statPrep = document.getElementById("stat-prep");
const statTransit = document.getElementById("stat-transit");
const statDelivered = document.getElementById("stat-delivered");

/**
 * Alterna la vista activa entre el 'Portal de Cliente' y el 'Panel de Operador'
 */
window.switchRole = function (role) {
    if (!viewClient || !viewOperator) return;

    if (role === 'client') {
        viewClient.classList.remove("hidden");
        viewClient.classList.add("grid");
        viewOperator.classList.add("hidden");
        viewOperator.classList.remove("grid");

        tabClient.className = "nav-btn nav-btn-active";
        tabOperator.className = "nav-btn nav-btn-inactive";

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 150);
    } else {
        viewOperator.classList.remove("hidden");
        viewOperator.classList.add("grid");
        viewClient.classList.add("hidden");
        viewClient.classList.remove("grid");

        tabOperator.className = "nav-btn nav-btn-active";
        tabClient.className = "nav-btn nav-btn-inactive";

        updateOperatorStats();
    }
};

/**
 * Inicializa el mapa Leaflet en el contenedor map-container
 */
function setupMap() {
    if (!document.getElementById("map-container")) return;
    if (map) return;

    map = L.map("map-container", {
        zoomControl: true
    }).setView([-34.6037, -58.3816], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contribuyentes'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    refreshMapMarkers();
}

/**
 * Redibuja los marcadores de los envíos sobre el mapa
 */
function refreshMapMarkers() {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    shipments.forEach(item => {
        if (!item.lat || !item.lon) return;

        const markerColor = item.status === "Entregado" ? "#10b981" : (item.status === "En camino" ? "#FF6200" : "#f59e0b");

        const customIcon = L.divIcon({
            className: "custom-pin",
            html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0px 1px 4px rgba(0,0,0,0.25);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const marker = L.marker([item.lat, item.lon], { icon: customIcon });

        const popupContent = `
  <div style="font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
    <div style="font-family: var(--font-mono); font-weight: 700; color: var(--color-carbon-950);">${item.trackingCode}</div>
    <div style="color: var(--color-carbon-600); font-weight: 500;">${item.recipient}</div>
    <div style="color: var(--color-carbon-500); font-size: 11px;">${item.address}</div>
  </div>
`;

        marker.bindPopup(popupContent);
        marker.addTo(markersLayer);
    });
}

/**
 * Devuelve el HTML del badge de estado
 */
function getStatusBadgeHtml(status) {
    switch (status) {
        case "En preparación":
            return `<span class="badge-status badge-prep">En preparación</span>`;
        case "En camino":
            return `<span class="badge-status badge-transit">En tránsito</span>`;
        case "Entregado":
            return `<span class="badge-status badge-delivered">Entregado</span>`;
        case "Cancelado":
            return `<span class="badge-status badge-canceled">Cancelado</span>`;
        default:
            return `<span class="badge-status" style="background-color: var(--color-carbon-100); color: var(--color-carbon-800);">${status}</span>`;
    }
}

/**
 * Actualiza las tarjetas de métricas del panel de operador
 */
function updateOperatorStats() {
    if (!statTotal) return;
    statTotal.textContent = shipments.length;
    statPrep.textContent = shipments.filter(s => s.status === "En preparación").length;
    statTransit.textContent = shipments.filter(s => s.status === "En camino").length;
    statDelivered.textContent = shipments.filter(s => s.status === "Entregado").length;
}

/**
 * Renderiza la planilla de envíos del operador
 */
function renderShipmentsTable(filterText = "") {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const filtered = shipments.filter(s => {
        const query = filterText.toLowerCase();
        return s.trackingCode.toLowerCase().includes(query) ||
            s.recipient.toLowerCase().includes(query) ||
            s.address.toLowerCase().includes(query);
    });

    if (counterBadge) {
        counterBadge.textContent = `${filtered.length} de ${shipments.length} envíos`;
    }
    updateOperatorStats();

    if (filtered.length === 0) {
        tableBody.innerHTML = `
  <tr>
    <td colspan="5" style="padding: 32px; text-align: center; color: var(--color-carbon-400); font-family: var(--font-mono); font-size: 12px;">
      Sin registros coincidentes.
    </td>
  </tr>
`;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
  <td style="font-family: var(--font-mono); font-weight: 600; color: var(--color-carbon-950);">
    ${item.trackingCode}
    <span style="display: block; font-size: 10px; color: var(--color-carbon-400); font-family: var(--font-sans); font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${item.address}</span>
  </td>
  <td style="font-weight: 500; color: var(--color-carbon-800);">
    ${item.recipient}
  </td>
  <td>
    <span style="font-family: var(--font-mono); font-size: 12px; background-color: var(--color-carbon-100); color: var(--color-carbon-900); border: 1px solid var(--color-carbon-200); padding: 2px 6px; border-radius: 4px;">${item.pin || '----'}</span>
  </td>
  <td>
    ${getStatusBadgeHtml(item.status)}
  </td>
  <td style="text-align: right; white-space: nowrap;">
    <button title="Ver en cliente" class="btn-table-action">
      Rastrear
    </button>
    <button title="Rótulo" class="btn-table-action">
      Rótulo
    </button>
    <button title="Editar" class="btn-table-icon">
      ✎
    </button>
    <button title="Eliminar" class="btn-table-icon delete">
      ✕
    </button>
  </td>
`;

        tableBody.appendChild(tr);
    });
}

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
        
        // Actualizar interfaz del operador y marcadores del mapa
        renderShipmentsTable();
        refreshMapMarkers();
        return shipments;
    } catch (error) {
        console.error("Error al consultar /api/envios:", error);
        return [];
    }
}

/**
 * Petición asíncrona para buscar un paquete por su código de guía (/api/envios/<tracking_code>)
 */
async function fetchShipmentByTracking(code) {
    if (!code) return null;
    try {
        const response = await fetch(`/api/envios/${encodeURIComponent(code.trim().toUpperCase())}`);
        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Envío ${code} no encontrado`);
            }
            return null;
        }
        const shipment = await response.json();
        console.log(`Envío ${code} encontrado desde API:`, shipment);
        return shipment;
    } catch (error) {
        console.error(`Error al consultar /api/envios/${code}:`, error);
        return null;
    }
}

// Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    setupMap();
    fetchShipments();

    if (btnSearch && searchInput) {
        btnSearch.addEventListener("click", async () => {
            const code = searchInput.value.trim();
            if (code) {
                const item = await fetchShipmentByTracking(code);
                if (item) {
                    console.log("Resultado de búsqueda:", item);
                }
            }
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                btnSearch.click();
            }
        });
    }
});

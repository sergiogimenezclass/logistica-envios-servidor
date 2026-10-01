// ============================================================================
// LOGITRACK EXPRESS — FASE 2: CONSUMO DE API RESTFUL FLASK
// ============================================================================

// Coordenadas del Hub Logístico Central (Mercado Central / Tapiales, PBA)
const LOGISTIC_HUB = {
    name: "Centro Logístico Central Tapiales",
    lat: -34.7082,
    lon: -58.4988
};

// Variable de estado global para los envíos obtenidos del backend
let shipments = [];

// Variables de estado del mapa Leaflet
let map = null;
let markersLayer = null;
let currentRoutePolyline = null;
let currentTruckMarker = null;
let currentHubMarker = null;
let destinationMarker = null;
let activeSimulatedShipment = null;

// Elementos del DOM de Navegación y Vistas
const tabClient = document.getElementById("tab-client");
const tabOperator = document.getElementById("tab-operator");
const viewClient = document.getElementById("view-client");
const viewOperator = document.getElementById("view-operator");

// Elementos del Portal de Cliente
const searchInput = document.getElementById("search-tracking-input");
const btnSearch = document.getElementById("btn-search-tracking");
const clientTrackingCode = document.getElementById("client-tracking-code");
const clientRecipient = document.getElementById("client-recipient");
const clientStatusBadge = document.getElementById("client-status-badge");
const clientAddress = document.getElementById("client-address");
const clientPackageType = document.getElementById("client-package-type");
const clientPinDisplay = document.getElementById("client-pin-display");

const simTrackingId = document.getElementById("sim-tracking-id");
const simRouteInfo = document.getElementById("sim-route-info");
const simProgressBar = document.getElementById("sim-progress-bar");
const simProgressText = document.getElementById("sim-progress-text");
const simEtaText = document.getElementById("sim-eta-text");
const timelineContainer = document.getElementById("timeline-container");
const quickDemoPills = document.getElementById("quick-demo-pills");
const btnSimPlayText = document.getElementById("btn-sim-play-text");
const btnSimPlayIcon = document.getElementById("btn-sim-play-icon");

// Elementos del DOM del Operador
const shipmentForm = document.getElementById("shipment-form");
const editIdInput = document.getElementById("edit-id");
const trackingCodeInput = document.getElementById("tracking-code");
const recipientInput = document.getElementById("recipient");
const addressInput = document.getElementById("address");
const statusSelect = document.getElementById("status");
const packageTypeSelect = document.getElementById("package-type");
const packagePinInput = document.getElementById("package-pin");
const btnGenerateCode = document.getElementById("btn-generate-code");
const formTitle = document.getElementById("form-title");
const formBadge = document.getElementById("form-badge");
const btnSubmit = document.getElementById("btn-submit");
const btnSubmitText = document.getElementById("btn-submit-text");
const btnSpinner = document.getElementById("btn-spinner");
const btnCancel = document.getElementById("btn-cancel");
const tableBody = document.getElementById("shipments-table-body");
const counterBadge = document.getElementById("counter-badge");

// Métricas de Control del Operador
const statTotal = document.getElementById("stat-total");
const statPrep = document.getElementById("stat-prep");
const statTransit = document.getElementById("stat-transit");
const statDelivered = document.getElementById("stat-delivered");

/** Genera un PIN aleatorio de 4 dígitos */
function generateRandomPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/** Genera un número de guía aleatorio con prefijo AR- */
function generateRandomTracking() {
    return "AR-" + Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Muestra una notificación emergente tipo Toast
 */
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");

    const styles = {
        success: "toast-success",
        error: "toast-error",
        info: "toast-info",
        warning: "toast-warning"
    };

    toast.className = `toast-msg opacity-0 ${styles[type] || styles.info}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("opacity-0");
    }, 20);

    setTimeout(() => {
        toast.classList.add("opacity-0");
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

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
            if (map) {
                map.invalidateSize();
                if (currentRoutePolyline) {
                    map.fitBounds(currentRoutePolyline.getBounds(), { padding: [40, 40] });
                }
            }
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
 * Realiza la geocodificación de una dirección a través de Nominatim
 */
async function geocodeAddress(queryAddress) {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryAddress)}`;

    try {
        const response = await fetch(endpoint, {
            headers: { "Accept-Language": "es" }
        });

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };
            }
        }
    } catch (err) {
        console.warn("Geocodificación con fallback:", err);
    }

    return {
        lat: -34.6037 + (Math.random() - 0.5) * 0.08,
        lon: -58.3816 + (Math.random() - 0.5) * 0.08
    };
}

/**
 * Consulta OSRM para obtener el trazado vial real entre el Hub y el Destino
 */
async function fetchRoadRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=geojson`;

    try {
        const res = await fetch(url);
        if (res.ok) {
            const json = await res.json();
            if (json.routes && json.routes.length > 0) {
                const rawCoords = json.routes[0].geometry.coordinates;
                const path = rawCoords.map(c => [c[1], c[0]]);
                const distanceKm = (json.routes[0].distance / 1000).toFixed(1);
                const durationMin = Math.round(json.routes[0].duration / 60);
                return { path, distanceKm, durationMin };
            }
        }
    } catch (err) {
        console.warn("OSRM no disponible, usando interpolación directa:", err);
    }

    const steps = 100;
    const fallbackPath = [];
    for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const curve = Math.sin(ratio * Math.PI) * 0.007;
        const lat = start.lat + (end.lat - start.lat) * ratio + curve;
        const lon = start.lon + (end.lon - start.lon) * ratio;
        fallbackPath.push([lat, lon]);
    }

    return { path: fallbackPath, distanceKm: "6.8", durationMin: 22 };
}

/**
 * Renderiza la línea de tiempo (timeline) del cliente según porcentaje de avance
 */
function renderTimeline(percentage) {
    if (!timelineContainer) return;
    const p = Math.round(percentage);
    const isPart1 = p >= 0;
    const isPart2 = p >= 25;
    const isPart3 = p >= 75;
    const isPart4 = p >= 100;

    const items = [
        { title: "Ingreso en Planta Central", desc: "Paquete clasificado y asignado al móvil.", active: isPart1, done: isPart2, time: "08:15" },
        { title: "En Tránsito Troncal", desc: "Desplazándose por red vial hacia la zona de entrega.", active: isPart2, done: isPart3, time: isPart2 ? "09:40" : "—" },
        { title: "Última Milla en Curso", desc: "Móvil en proximidad de destino. Preparar PIN.", active: isPart3, done: isPart4, time: isPart3 ? "11:20" : "—" },
        { title: "Entrega Finalizada", desc: isPart4 ? "PIN validado en mano. Paquete entregado." : "Aguardando verificación de PIN.", active: isPart4, done: isPart4, time: isPart4 ? "12:05" : "—" }
    ];

    timelineContainer.innerHTML = items.map(it => `
<div class="timeline-item">
  <div style="position: absolute; left: 0px; top: 6px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-family: var(--font-mono); font-weight: 700; transition: all 0.2s ease; ${
      it.done ? 'background-color: var(--color-fedex-purple); color: #ffffff;' : it.active ? 'background-color: var(--color-fedex-orange); color: #ffffff;' : 'background-color: var(--color-carbon-200); color: var(--color-carbon-400);'
  }">
    ${it.done ? '✓' : ''}
  </div>
  <div style="flex: 1;">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <h4 style="font-size: 12px; font-weight: 700; color: ${it.active ? 'var(--color-carbon-950)' : 'var(--color-carbon-400)'};">${it.title}</h4>
      <span style="font-size: 10px; font-family: var(--font-mono); font-weight: 700; color: var(--color-carbon-400);">${it.time}</span>
    </div>
    <p style="font-size: 11px; color: ${it.active ? 'var(--color-carbon-600)' : 'var(--color-carbon-400)'}; margin-top: 2px; line-height: 1.4;">${it.desc}</p>
  </div>
</div>
`).join("");
}

/**
 * Renderiza los botones de píldoras de rastreo rápido en el cliente
 */
function renderQuickDemoPills() {
    if (!quickDemoPills) return;
    quickDemoPills.innerHTML = '<span style="color: #e9d5ff; font-weight: 700;">Rastreo rápido:</span>' +
        shipments.slice(0, 4).map(s => `
  <button onclick="quickSearchDemo('${s.trackingCode}')" class="pill-btn">
    ${s.trackingCode}
  </button>
`).join("");
}

/**
 * Ejecuta la búsqueda desde una píldora rápida
 */
window.quickSearchDemo = async function (code) {
    if (searchInput) searchInput.value = code;
    const item = await fetchShipmentByTracking(code);
    if (item) {
        selectShipmentForSimulation(item);
    } else {
        showToast("Código de seguimiento no encontrado", "error");
    }
};

/**
 * Prepara la ruta de simulación para un envío seleccionado y enfoca el mapa
 */
async function selectShipmentForSimulation(item) {
    if (!item) return;
    activeSimulatedShipment = item;

    if (clientTrackingCode) clientTrackingCode.textContent = item.trackingCode;
    if (clientRecipient) clientRecipient.textContent = item.recipient;
    if (clientAddress) clientAddress.textContent = item.address;
    if (clientPackageType) clientPackageType.textContent = item.packageType || "FedEx Express Standard";
    if (clientStatusBadge) clientStatusBadge.innerHTML = getStatusBadgeHtml(item.status);
    if (clientPinDisplay) clientPinDisplay.textContent = item.pin || "----";

    if (simTrackingId) simTrackingId.textContent = `Guía ${item.trackingCode}`;
    if (simRouteInfo) simRouteInfo.textContent = `Calculando ruta hacia ${item.address}...`;
    if (simProgressBar) simProgressBar.style.width = "0%";
    if (simProgressText) simProgressText.textContent = "0%";

    if (currentRoutePolyline) map.removeLayer(currentRoutePolyline);
    if (currentTruckMarker) map.removeLayer(currentTruckMarker);
    if (currentHubMarker) map.removeLayer(currentHubMarker);
    if (destinationMarker) map.removeLayer(destinationMarker);

    // Marcadores del Hub Central y Destino
    const hubIcon = L.divIcon({
        className: "custom-hub-icon",
        html: `<div style="background-color: var(--color-fedex-purple); color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: var(--font-mono); font-weight: 700; box-shadow: var(--shadow-subtle); border: 1px solid #e9d5ff;">HUB CENTRAL</div>`,
        iconSize: [80, 20],
        iconAnchor: [40, 10]
    });
    currentHubMarker = L.marker([LOGISTIC_HUB.lat, LOGISTIC_HUB.lon], { icon: hubIcon }).addTo(map);

    const destIcon = L.divIcon({
        className: "custom-dest-icon",
        html: `<div style="background-color: var(--color-fedex-orange); color: #ffffff; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: var(--font-mono); font-weight: 700; box-shadow: var(--shadow-subtle); border: 1px solid #ffedd5;">DESTINO</div>`,
        iconSize: [64, 20],
        iconAnchor: [32, 10]
    });
    destinationMarker = L.marker([item.lat, item.lon], { icon: destIcon }).addTo(map);

    // Marcador dinámico del móvil (Camioncito)
    const truckIcon = L.divIcon({
        className: "custom-truck-icon",
        html: `<div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--color-fedex-orange); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: var(--shadow-card); border: 2px solid #ffffff;">🚚</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
    currentTruckMarker = L.marker([LOGISTIC_HUB.lat, LOGISTIC_HUB.lon], { icon: truckIcon }).addTo(map);

    const routeData = await fetchRoadRoute(LOGISTIC_HUB, item);

    if (simRouteInfo) simRouteInfo.textContent = `${routeData.distanceKm} km · Tránsito regular (~${routeData.durationMin} min)`;
    if (simEtaText) simEtaText.textContent = `ETA: ~${routeData.durationMin} min`;

    currentRoutePolyline = L.polyline(routeData.path, {
        color: "#4D148C",
        weight: 4,
        opacity: 0.9,
        lineCap: "round"
    }).addTo(map);

    map.fitBounds(currentRoutePolyline.getBounds(), { padding: [40, 40] });
    renderTimeline(0);

    if (btnSimPlayText) btnSimPlayText.textContent = "Iniciar";
    if (btnSimPlayIcon) btnSimPlayIcon.textContent = "▶";
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
 * Carga los datos de un envío en el formulario para su modificación
 */
window.prepareEdit = function (id) {
    const item = shipments.find(s => s.id === id);
    if (!item) return;

    if (editIdInput) editIdInput.value = item.id;
    if (trackingCodeInput) trackingCodeInput.value = item.trackingCode;
    if (recipientInput) recipientInput.value = item.recipient;
    if (addressInput) addressInput.value = item.address;
    if (statusSelect) statusSelect.value = item.status;
    if (packageTypeSelect) packageTypeSelect.value = item.packageType || "Paquete estándar (2 - 10kg)";
    if (packagePinInput) packagePinInput.value = item.pin || generateRandomPin();

    if (formTitle) formTitle.textContent = "Editar Envío";
    if (formBadge) formBadge.textContent = "Edición";
    if (btnSubmitText) btnSubmitText.textContent = "Actualizar Envío";
    if (btnCancel) btnCancel.classList.remove("hidden");

    if (shipmentForm) shipmentForm.scrollIntoView({ behavior: "smooth" });
};

/**
 * Restablece el formulario al modo 'Alta'
 */
function resetForm() {
    if (!shipmentForm) return;
    shipmentForm.reset();
    if (editIdInput) editIdInput.value = "";
    if (packagePinInput) packagePinInput.value = generateRandomPin();
    if (trackingCodeInput) trackingCodeInput.value = generateRandomTracking();
    if (formTitle) formTitle.textContent = "Registrar Nuevo Envío";
    if (formBadge) formBadge.textContent = "Alta";
    if (btnSubmitText) btnSubmitText.textContent = "Guardar Envío";
    if (btnCancel) btnCancel.classList.add("hidden");
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
    <button onclick="prepareEdit(${item.id})" title="Editar" class="btn-table-icon">
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
        
        // Actualizar interfaz del operador, marcadores y píldoras rápidas
        renderShipmentsTable();
        refreshMapMarkers();
        renderQuickDemoPills();

        if (shipments.length > 0) {
            selectShipmentForSimulation(shipments[0]);
        }
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

/**
 * Petición asíncrona POST para crear un nuevo envío en la API Flask
 */
async function createShipment(shipmentData) {
    try {
        const response = await fetch('/api/envios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shipmentData)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Error HTTP ${response.status}`);
        }

        const createdShipment = await response.json();
        console.log("Nuevo envío creado en backend SQLite:", createdShipment);
        return createdShipment;
    } catch (error) {
        console.error("Error al crear envío vía POST /api/envios:", error);
        showToast(error.message || "Error al crear envío", "error");
        return null;
    }
}

/**
 * Petición asíncrona PUT para actualizar un envío existente en la API Flask
 */
async function updateShipment(id, updatedData) {
    try {
        const response = await fetch(`/api/envios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Error HTTP ${response.status}`);
        }

        const updatedShipment = await response.json();
        console.log(`Envío ${id} actualizado en backend SQLite:`, updatedShipment);
        return updatedShipment;
    } catch (error) {
        console.error(`Error al actualizar envío ${id} vía PUT /api/envios/<id>:`, error);
        showToast(error.message || "Error al actualizar envío", "error");
        return null;
    }
}

// Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    if (packagePinInput) packagePinInput.value = generateRandomPin();
    if (trackingCodeInput) trackingCodeInput.value = generateRandomTracking();

    setupMap();
    fetchShipments();

    if (btnGenerateCode && trackingCodeInput) {
        btnGenerateCode.addEventListener("click", () => {
            trackingCodeInput.value = generateRandomTracking();
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener("click", resetForm);
    }

    if (btnSearch && searchInput) {
        btnSearch.addEventListener("click", async () => {
            const code = searchInput.value.trim();
            if (code) {
                const item = await fetchShipmentByTracking(code);
                if (item) {
                    selectShipmentForSimulation(item);
                } else {
                    showToast("Código de seguimiento no encontrado", "error");
                }
            } else {
                showToast("Ingresá un código de guía", "warning");
            }
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                btnSearch.click();
            }
        });
    }

    if (shipmentForm) {
        shipmentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const id = editIdInput.value;
            const trackingCode = trackingCodeInput.value.trim().toUpperCase();
            const recipient = recipientInput.value.trim();
            const address = addressInput.value.trim();
            const status = statusSelect.value;
            const packageType = packageTypeSelect.value;
            const pin = packagePinInput.value.trim() || generateRandomPin();

            btnSubmit.disabled = true;
            if (btnSpinner) btnSpinner.classList.remove("hidden");

            if (id) {
                // Modo Edición (PUT)
                const existing = shipments.find(s => s.id === parseInt(id));
                let lat = existing ? existing.lat : -34.6037;
                let lon = existing ? existing.lon : -58.3816;

                if (existing && existing.address !== address) {
                    const coords = await geocodeAddress(address);
                    lat = coords.lat;
                    lon = coords.lon;
                }

                const updatedData = {
                    trackingCode,
                    recipient,
                    address,
                    status,
                    packageType,
                    pin,
                    lat,
                    lon
                };

                const updated = await updateShipment(parseInt(id), updatedData);

                btnSubmit.disabled = false;
                if (btnSpinner) btnSpinner.classList.add("hidden");

                if (updated) {
                    showToast(`Envío ${trackingCode} actualizado exitosamente`, "info");
                    resetForm();
                    await fetchShipments();
                }
            } else {
                // Modo Alta (POST)
                const coords = await geocodeAddress(address);
                const newPackage = {
                    trackingCode,
                    recipient,
                    address,
                    status,
                    packageType,
                    pin,
                    lat: coords.lat,
                    lon: coords.lon
                };

                const created = await createShipment(newPackage);

                btnSubmit.disabled = false;
                if (btnSpinner) btnSpinner.classList.add("hidden");

                if (created) {
                    showToast(`Envío ${trackingCode} creado exitosamente`, "success");
                    resetForm();
                    await fetchShipments();
                    selectShipmentForSimulation(created);
                }
            }
        });
    }
});

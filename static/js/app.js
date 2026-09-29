// ============================================================================
// LOGITRACK EXPRESS — FASE 2: CONSUMO DE API RESTFUL FLASK
// ============================================================================

// Variable de estado global para los envíos obtenidos del backend
let shipments = [];

// Elementos del DOM del Operador
const tableBody = document.getElementById("shipments-table-body");
const counterBadge = document.getElementById("counter-badge");

// Métricas de Control del Operador
const statTotal = document.getElementById("stat-total");
const statPrep = document.getElementById("stat-prep");
const statTransit = document.getElementById("stat-transit");
const statDelivered = document.getElementById("stat-delivered");

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
        
        // Actualizar interfaz del operador
        renderShipmentsTable();
        return shipments;
    } catch (error) {
        console.error("Error al consultar /api/envios:", error);
        return [];
    }
}

// Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    fetchShipments();
});

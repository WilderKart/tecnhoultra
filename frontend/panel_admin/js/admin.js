// admin.js

let charts = {}; // Objeto para almacenar las instancias de los gráficos y poder destruirlos
let currentPage = 1; // Variable para la paginación
let currentSearchTerm = ''; // Variable para la búsqueda

// --- CONFIGURACIÓN DE API ---
const API_BASE_URL = '/api'; // Base URL relativa

/**
 * Función Debounce para retrasar la ejecución de una función.
 */
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.accessToken) {
        window.location.href = '../login.html';
        return;
    }
    initPanel(user);
});

function initPanel(user) {
    // Mostrar nombre y logout
    const adminNameSpan = document.getElementById('admin-name');
    if (adminNameSpan) adminNameSpan.textContent = user.nombre;

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '../login.html';
        });
    }

    // Acciones tabla y modal
    document.getElementById('clientes-body')?.addEventListener('click', handleTableActions);
    const editForm = document.getElementById('edit-form');
    if (editForm) editForm.addEventListener('submit', handleEditFormSubmit);
    document.getElementById('cancel-edit')?.addEventListener('click', closeEditModal);
    document.getElementById('close-modal-button')?.addEventListener('click', closeEditModal);

    // Búsqueda con debounce
    const searchInput = document.getElementById('search-clientes');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((event) => {
            currentSearchTerm = event.target.value.trim();
            currentPage = 1;
            loadMainData(currentPage, currentSearchTerm);
        }, 400));
    }

    // Paginación
    document.getElementById('pagination-container')?.addEventListener('click', handlePaginationClick);

    // Cargar data inicial
    loadMainData(currentPage);
    loadDashboardMetrics();
    loadChartData();
}

// --- CRUD PRINCIPAL ---

async function loadMainData(page = 1, search = '') {
    const token = JSON.parse(localStorage.getItem('user'))?.accessToken;
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/formulario?page=${page}&search=${encodeURIComponent(search)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'x-access-token': token }
        });

        if (response.status === 401 || response.status === 403) {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            localStorage.removeItem('user');
            window.location.href = '../login.html';
            return;
        }

        const paginatedResult = await response.json();
        if (!response.ok) throw new Error(paginatedResult.message || 'Error al obtener los datos.');

        renderClientesTable(paginatedResult.data);
        populateSuggestions(paginatedResult.data);
        renderProyectosTable(paginatedResult.data);
        renderAnalisis(paginatedResult.data);
        renderPagination(paginatedResult);

    } catch (error) {
        console.error('Error en loadMainData:', error);
        const tableBody = document.getElementById('clientes-body');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center error-message">${error.message}</td></tr>`;
        }
    }
}

// --- PAGINACIÓN ---
function renderPagination({ totalItems, totalPages, currentPage }) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;
    if (totalItems === 0) {
        paginationContainer.innerHTML = '';
        return;
    }
    const limit = 10;
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(startItem + limit - 1, totalItems);
    paginationContainer.innerHTML = `
        <div class="pagination-info">Mostrando ${startItem}-${endItem} de ${totalItems} resultados</div>
        <div class="pagination-controls">
            <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
            <button id="next-page" ${currentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
        </div>`;
}
function handlePaginationClick(event) {
    if (event.target.id === 'prev-page' && !event.target.disabled) loadMainData(--currentPage, currentSearchTerm);
    if (event.target.id === 'next-page' && !event.target.disabled) loadMainData(++currentPage, currentSearchTerm);
}
function populateSuggestions(data) {
    const suggestionsDatalist = document.getElementById('clientes-suggestions');
    if (!suggestionsDatalist) return;
    suggestionsDatalist.innerHTML = '';
    data.forEach(item => {
        suggestionsDatalist.innerHTML += `<option value="${item.nombre_completo}"></option>`;
    });
}

// --- DASHBOARD CHARTS ---
async function loadChartData() {
    const token = JSON.parse(localStorage.getItem('user'))?.accessToken;
    if (!token) return;
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/charts`, {
            headers: { 'x-access-token': token }
        });
        if (!response.ok) throw new Error('No se pudieron cargar los datos de los gráficos.');
        const chartData = await response.json();
        renderNegociosChart(chartData.distribucionNegocios);
        renderEvolucionChart(chartData.evolucionSolicitudes);
    } catch (error) {
        console.error('Error al cargar datos de los gráficos:', error);
    }
}
function renderNegociosChart(data) {
    const ctx = document.getElementById('chart-negocios')?.getContext('2d');
    if (!ctx) return;
    if (charts.negocios) charts.negocios.destroy();
    const labels = data.map(item => item.tipo_negocio || 'No especificado');
    const counts = data.map(item => item.count);
    charts.negocios = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ label: 'Solicitudes', data: counts, backgroundColor: ['#5c6bc0','#4caf50','#ff9800','#9c27b0','#e74c3c','#3498db'], borderColor: '#fff', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}
function renderEvolucionChart(data) {
    const ctx = document.getElementById('chart-evolucion')?.getContext('2d');
    if (!ctx) return;
    if (charts.evolucion) charts.evolucion.destroy();
    const labels = data.map(item => new Date(item.date).toLocaleDateString('es-ES',{day:'numeric',month:'short'}));
    const counts = data.map(item => item.count);
    charts.evolucion = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label:'Nuevas Solicitudes', data: counts, fill:true, backgroundColor:'rgba(92, 107, 192, 0.2)', borderColor:'#5c6bc0', tension:0.3, pointBackgroundColor:'#5c6bc0', pointRadius:4 }] },
        options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } }, plugins:{ legend:{ display:false } } }
    });
}

// --- CRUD CLIENTES / PROYECTOS ---
function renderClientesTable(clientes) { /* ... mismo código que tenías ... */ }
async function handleTableActions(event) { /* ... mismo código ... */ }
async function deleteSolicitud(id) {
    const token = JSON.parse(localStorage.getItem('user'))?.accessToken;
    if (!token) return;
    try {
        const response = await fetch(`${API_BASE_URL}/formulario/${id}`, { method: 'DELETE', headers: { 'x-access-token': token } });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'No se pudo eliminar la solicitud.');
        }
        alert('Solicitud eliminada correctamente.');
        loadMainData(currentPage, currentSearchTerm);
        loadDashboardMetrics();
    } catch (error) {
        console.error('Error al eliminar la solicitud:', error);
        alert(`Error: ${error.message}`);
    }
}
async function openEditModal(id) { /* ... mismo código pero usando `${API_BASE_URL}/formulario/${id}` ... */ }
function closeEditModal() { /* ... igual ... */ }
async function handleEditFormSubmit(event) { /* ... igual pero con `${API_BASE_URL}/formulario/${id}` ... */ }

function renderProyectosTable(proyectos) { /* ... igual ... */ }
function renderAnalisis(data) { /* ... igual ... */ }
function showSection(sectionId) { /* ... igual ... */ }

// --- MÉTRICAS DASHBOARD ---
async function loadDashboardMetrics() {
    const token = JSON.parse(localStorage.getItem('user'))?.accessToken;
    if (!token) return;
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/metrics`, { headers: { 'x-access-token': token } });
        if (!response.ok) throw new Error('No se pudieron cargar las métricas.');
        const metrics = await response.json();
        updateMetricCards(metrics);
    } catch (error) {
        console.error('Error al cargar métricas del dashboard:', error);
    }
}
function updateMetricCards(metrics) { /* ... igual ... */ }

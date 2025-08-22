let charts = {}; // Objeto para almacenar las instancias de los gráficos y poder destruirlos
let currentPage = 1; // Variable para la paginación
let currentSearchTerm = ''; // Variable para la búsqueda

/**
 * Función Debounce para retrasar la ejecución de una función.
 * Evita que se hagan demasiadas llamadas a la API mientras el usuario escribe.
 * @param {Function} func La función a ejecutar.
 * @param {number} delay El tiempo de espera en milisegundos.
 */
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener los datos del usuario desde localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    // 2. Proteger la ruta: si no hay usuario o token, redirigir a la página de login
    if (!user || !user.accessToken) {
        window.location.href = '../login.html'; // Desde html/admin.html, subimos un nivel
        return; // Detener la ejecución del script
    }

    // 3. Si el usuario es válido, inicializar el panel
    initPanel(user);
});

function initPanel(user) {
    // Mostrar nombre de usuario y configurar logout
    const adminNameSpan = document.getElementById('admin-name'); // ID para el nombre de usuario
    if (adminNameSpan) {
        adminNameSpan.textContent = user.nombre;
    }

    const logoutButton = document.getElementById('logout-button'); // ID para el botón de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '../login.html';
        });
    }
    
    // Añadir event listener para los botones de la tabla y el formulario de edición
    const clientesTableBody = document.getElementById('clientes-body');
    if (clientesTableBody) {
        clientesTableBody.addEventListener('click', handleTableActions);
    }

    // Event listeners para el modal de edición
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmit);
    }
    document.getElementById('cancel-edit')?.addEventListener('click', closeEditModal);
    document.getElementById('close-modal-button')?.addEventListener('click', closeEditModal);

    // Event listener para la búsqueda de clientes
    const searchInput = document.getElementById('search-clientes');
    if (searchInput) {
        // Usamos el evento 'input' para una búsqueda en tiempo real con "debounce"
        // para no sobrecargar el servidor con cada pulsación de tecla.
        searchInput.addEventListener('input', debounce((event) => {
            currentSearchTerm = event.target.value.trim();
            currentPage = 1; // Resetear a la primera página con cada nueva búsqueda
            loadMainData(currentPage, currentSearchTerm);
        }, 400)); // Espera 400ms después de que el usuario deja de escribir
    }

    // Event listener para la paginación
    document.getElementById('pagination-container')?.addEventListener('click', handlePaginationClick);

    // Cargar los datos principales (clientes, proyectos, etc.)
    loadMainData(currentPage);
    // Cargar las métricas del dashboard
    loadDashboardMetrics();
    // Cargar los datos para los gráficos
    loadChartData();
}

// Función para obtener los datos principales y renderizar las tablas
async function loadMainData(page = 1, search = '') {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.accessToken : null;
    
    if (!token) {
        console.error('No hay token, no se pueden cargar los clientes.');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3001/api/formulario?page=${page}&search=${encodeURIComponent(search)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token // Enviar el token en la cabecera de autorización
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            // Token inválido o expirado, desloguear
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            localStorage.removeItem('user');
            window.location.href = '../login.html';
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener los datos.');
        }
        
        const paginatedResult = await response.json();

        renderClientesTable(paginatedResult.data);
        populateSuggestions(paginatedResult.data); // <-- Esto ya estaba bien
        renderProyectosTable(paginatedResult.data); // <-- Añadir esta línea
        renderAnalisis(paginatedResult.data); // <-- Añadir esta línea
        renderPagination(paginatedResult);
        
    } catch (error) {
        console.error('Error en loadMainData:', error);
        const tableBody = document.getElementById('clientes-body');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center error-message">${error.message}</td></tr>`;
        }
    }
}

// --- INICIO: LÓGICA DE PAGINACIÓN ---

function renderPagination({ totalItems, totalPages, currentPage }) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    if (totalItems === 0) {
        paginationContainer.innerHTML = '';
        return;
    }

    const limit = 10; // El mismo límite que en el backend
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(startItem + limit - 1, totalItems);

    paginationContainer.innerHTML = `
        <div class="pagination-info">
            Mostrando ${startItem}-${endItem} de ${totalItems} resultados
        </div>
        <div class="pagination-controls">
            <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
            <button id="next-page" ${currentPage >= totalPages ? 'disabled' : ''}>Siguiente</button>
        </div>
    `;
}

function handlePaginationClick(event) {
    const target = event.target;
    if (target.id === 'prev-page' && !target.disabled) {
        loadMainData(--currentPage, currentSearchTerm);
    }
    if (target.id === 'next-page' && !target.disabled) {
        loadMainData(++currentPage, currentSearchTerm);
    }
}

/**
 * Puebla el datalist con sugerencias de nombres de clientes.
 * @param {Array} data - El array completo de datos de clientes/proyectos.
 */
function populateSuggestions(data) {
    const suggestionsDatalist = document.getElementById('clientes-suggestions');
    if (!suggestionsDatalist) return;

    suggestionsDatalist.innerHTML = ''; // Limpiar sugerencias anteriores

    data.forEach(item => {
        suggestionsDatalist.innerHTML += `<option value="${item.nombre_completo}"></option>`;
    });
}

// --- INICIO: LÓGICA PARA GRÁFICOS ---

async function loadChartData() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.accessToken : null;
    if (!token) return;

    try {
        const response = await fetch('http://localhost:3001/api/dashboard/charts', {
            headers: { 'x-access-token': token }
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar los datos de los gráficos.');
        }

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

    if (charts.negocios) {
        charts.negocios.destroy();
    }

    const labels = data.map(item => item.tipo_negocio || 'No especificado');
    const counts = data.map(item => item.count);

    charts.negocios = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Solicitudes',
                data: counts,
                backgroundColor: ['#5c6bc0', '#4caf50', '#ff9800', '#9c27b0', '#e74c3c', '#3498db'],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function renderEvolucionChart(data) {
    const ctx = document.getElementById('chart-evolucion')?.getContext('2d');
    if (!ctx) return;

    if (charts.evolucion) {
        charts.evolucion.destroy();
    }

    const labels = data.map(item => new Date(item.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
    const counts = data.map(item => item.count);

    charts.evolucion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nuevas Solicitudes',
                data: counts,
                fill: true,
                backgroundColor: 'rgba(92, 107, 192, 0.2)',
                borderColor: '#5c6bc0',
                tension: 0.3,
                pointBackgroundColor: '#5c6bc0',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

// --- FIN: LÓGICA PARA GRÁFICOS ---

// Función para "pintar" la tabla de clientes en el HTML
function renderClientesTable(clientes) {
    const tableBody = document.getElementById('clientes-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla
    
    if (clientes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay solicitudes de clientes registradas.</td></tr>';
        return;
    }
    
    clientes.forEach(cliente => {
        // Formatear la fecha a un formato legible
        const fecha = new Date(cliente.fecha_creacion).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cliente.nombre_completo || '-'}</td>
            <td>${cliente.empresa || '-'}</td>
            <td>${cliente.correo || '-'}</td>
            <td>${cliente.telefono || '-'}</td>
            <td><a href="${cliente.sitio_web_o_redes || '#'}" target="_blank" title="${cliente.sitio_web_o_redes || ''}">${cliente.sitio_web_o_redes ? 'Visitar' : '-'}</a></td>
            <td>${fecha}</td>
            <td class="actions">
                <button class="btn-action btn-edit" data-id="${cliente.proyecto_id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
                <button class="btn-action btn-delete" data-id="${cliente.proyecto_id}" title="Eliminar"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- INICIO: LÓGICA PARA ELIMINAR ---

async function handleTableActions(event) {
    // Usamos .closest() para asegurarnos de capturar el click incluso si es en el ícono <i>
    const targetButton = event.target.closest('button');
    if (!targetButton) return;

    const id = targetButton.dataset.id;
    if (!id) return;

    if (targetButton.classList.contains('btn-delete')) {
        if (confirm(`¿Estás seguro de que quieres eliminar la solicitud con ID ${id}? Esta acción no se puede deshacer.`)) {
            await deleteSolicitud(id);
        }
    }

    if (targetButton.classList.contains('btn-edit')) {
        await openEditModal(id);
    }
}

async function deleteSolicitud(id) {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.accessToken : null;
    if (!token) return;

    try {
        const response = await fetch(`http://localhost:3001/api/formulario/${id}`, {
            method: 'DELETE',
            headers: { 'x-access-token': token }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'No se pudo eliminar la solicitud.');
        }

        alert('Solicitud eliminada correctamente.');
        loadMainData(currentPage, currentSearchTerm); // Recargar la página actual
        loadDashboardMetrics(); // Recargar métricas por si algo cambió
    } catch (error) {
        console.error('Error al eliminar la solicitud:', error);
        alert(`Error: ${error.message}`);
    }
}

async function openEditModal(id) {
    console.log(`[1] Intentando abrir modal para editar ID: ${id}`);
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.accessToken : null;
    if (!token) return;

    try {
        console.log('[2] Realizando fetch al backend...');
        const response = await fetch(`http://localhost:3001/api/formulario/${id}`, {
            headers: { 'x-access-token': token }
        });
        console.log(`[3] Respuesta recibida del backend con estado: ${response.status}`);

        if (!response.ok) {
            // Intenta leer el error específico del backend.
            const errorData = await response.json().catch(() => ({ error: 'No se pudo leer la respuesta del servidor.' }));
            throw new Error(errorData.error || 'No se pudieron cargar los datos para editar.');
        }

        const data = await response.json();
        console.log('[4] Datos JSON parseados:', data);

        // Verificación de seguridad: Asegurarse de que los datos del cliente existen
        if (!data.cliente) {
            throw new Error('Los datos del cliente asociado a este proyecto no se encontraron. La solicitud puede estar corrupta.');
        }
        console.log('[5] Verificación del cliente exitosa.');

        // --- Rellenar el formulario del modal de forma segura ---
        const setInputValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                console.log(`  -> Rellenando #${id} con valor:`, value);
                element.value = value || '';
            } else {
                console.warn(`Elemento con ID "${id}" no encontrado en el DOM.`);
            }
        };

        console.log('[6] Rellenando el formulario del modal...');
        // Rellenar el formulario del modal
        setInputValue('edit-id', data.id); // Este es el ID del proyecto
        setInputValue('edit-nombre_completo', data.cliente.nombre_completo);
        setInputValue('edit-empresa', data.cliente.empresa);
        setInputValue('edit-correo', data.cliente.correo);
        setInputValue('edit-telefono', data.cliente.telefono);
        setInputValue('edit-sitio_web_o_redes', data.cliente.sitio_web_o_redes);
        setInputValue('edit-producto_principal', data.producto_principal);
        setInputValue('edit-rango_presupuesto', data.rango_presupuesto);
        setInputValue('edit-comentarios', data.comentarios);
        console.log('[7] Formulario rellenado.');

        // Mostrar el modal
        const modalElement = document.getElementById('edit-modal');
        if (modalElement) {
            console.log('[8] Mostrando modal quitando la clase .hidden...');
            modalElement.classList.remove('hidden');
            console.log('[9] ¡Modal debería ser visible ahora!');
        } else {
            console.error('[ERROR] No se encontró el elemento del modal con ID "edit-modal".');
        }
    } catch (error) {
        console.error('Error en openEditModal:', error); // Loguear el error real en consola
        alert(`Error al cargar datos para editar:\n\n${error.message}\n\nEsto suele ocurrir si los datos en la base de datos son inconsistentes (ej. el proyecto o su cliente fueron eliminados). Intenta con un registro creado recientemente.`);
    }
}

function closeEditModal() {
    const modalElement = document.getElementById('edit-modal');
    if (modalElement) modalElement.classList.add('hidden');
}

async function handleEditFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('edit-id').value;
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.accessToken : null;
    if (!id || !token) return;

    const updatedData = {
        nombre_completo: document.getElementById('edit-nombre_completo').value,
        empresa: document.getElementById('edit-empresa').value,
        correo: document.getElementById('edit-correo').value,
        telefono: document.getElementById('edit-telefono').value,
        sitio_web_o_redes: document.getElementById('edit-sitio_web_o_redes').value,
        producto_principal: document.getElementById('edit-producto_principal').value,
        rango_presupuesto: document.getElementById('edit-rango_presupuesto').value,
        comentarios: document.getElementById('edit-comentarios').value,
    };

    try {
        const response = await fetch(`http://localhost:3001/api/formulario/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-access-token': token },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'No se pudo actualizar la solicitud.');
        }

        alert('Solicitud actualizada correctamente.');
        closeEditModal();
        loadMainData(currentPage, currentSearchTerm);
        loadDashboardMetrics();
    } catch (error) {
        console.error('Error al actualizar la solicitud:', error);
        alert(`Error: ${error.message}`);
    }
}

// --- FIN: LÓGICA PARA ELIMINAR ---

// Función para "pintar" la tabla de Proyectos en el HTML
function renderProyectosTable(proyectos) {
    const tableBody = document.getElementById('proyectos-body');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Limpiar la tabla

    if (proyectos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay proyectos registrados.</td></tr>';
        return;
    }

    proyectos.forEach(proyecto => {
        const fechaLimite = proyecto.fecha_limite 
            ? new Date(proyecto.fecha_limite).toLocaleDateString('es-ES') 
            : '-';
        
        const presupuesto = proyecto.rango_presupuesto || '-';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${proyecto.nombre_completo || '-'}</td>
            <td>${proyecto.producto_principal || '-'}</td>
            <td>${presupuesto}</td>
            <td>${fechaLimite}</td>
            <td>${proyecto.publico_objetivo || '-'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Función para "pintar" la sección de Análisis
function renderAnalisis(data) {
    const diferenciaList = document.getElementById('diferencia-list');
    const detallesList = document.getElementById('detalles-list');

    if (!diferenciaList || !detallesList) return;

    diferenciaList.innerHTML = '';
    detallesList.innerHTML = '';

    if (data.length === 0) {
        diferenciaList.innerHTML = '<li>No hay datos para analizar.</li>';
        detallesList.innerHTML = '<p>No hay detalles adicionales.</p>';
        return;
    }

    data.forEach(item => {
        // Añadir a la lista de "diferenciales"
        if (item.diferencial) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.nombre_completo || 'Cliente'}:</strong> ${item.diferencial}`;
            diferenciaList.appendChild(li);
        }

        // Añadir a la lista de "detalles"
        if (item.comentarios) {
            const div = document.createElement('div');
            div.classList.add('detalle-item'); // Clase para posible estilo futuro
            div.innerHTML = `
                <h4>Proyecto de ${item.nombre_completo || 'Cliente'}</h4>
                <p>${item.comentarios}</p>`;
            detallesList.appendChild(div);
        }
    });
}

/**
 * Función para mostrar/ocultar secciones del panel de administración.
 * Es llamada por los `onclick` del menú lateral en admin.html.
 * @param {string} sectionId - El ID de la sección a mostrar.
 */
function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.main .section');
    sections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });

    // Mostrar la sección seleccionada
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.remove('hidden');
        activeSection.classList.add('active');
    }

    // Actualizar el estado 'active' en el menú lateral
    const navItems = document.querySelectorAll('.sidebar nav ul li');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick') === `showSection('${sectionId}')`) {
            item.classList.add('active');
        }
    });
}

// Función para obtener y mostrar las métricas del Dashboard
async function loadDashboardMetrics() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.accessToken : null;

    if (!token) return;

    try {
        const response = await fetch('http://localhost:3001/api/dashboard/metrics', {
            headers: { 'x-access-token': token }
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar las métricas.');
        }

        const metrics = await response.json();
        updateMetricCards(metrics);

    } catch (error) {
        console.error('Error al cargar métricas del dashboard:', error);
    }
}

// Función para actualizar las tarjetas del dashboard con los datos recibidos
function updateMetricCards(metrics) {
    // Total de Solicitudes
    const totalSolicitudesEl = document.getElementById('total-solicitudes');
    if (totalSolicitudesEl) {
        totalSolicitudesEl.textContent = metrics.totalSolicitudes || 0;
    }

    // Presupuesto Promedio
    const promedioPresupuestoEl = document.getElementById('promedio-presupuesto');
    if (promedioPresupuestoEl) {
        const promedio = metrics.promedioPresupuesto || 0;
        promedioPresupuestoEl.textContent = promedio.toLocaleString('es-ES', { style: 'currency', currency: 'USD' });
    }

    // Tipos de Negocio
    const tiposNegocioEl = document.getElementById('tipos-negocio');
    if (tiposNegocioEl) {
        tiposNegocioEl.textContent = metrics.tiposNegocio || 0;
    }

    // Próximo Proyecto
    const proximoProyectoEl = document.getElementById('proximo-proyecto');
    if (proximoProyectoEl) {
        if (metrics.proximoProyecto) {
            const fecha = new Date(metrics.proximoProyecto.fecha).toLocaleDateString('es-ES');
            proximoProyectoEl.innerHTML = `${metrics.proximoProyecto.nombre} <br><small>(${fecha})</small>`;
        } else {
            proximoProyectoEl.textContent = 'Ninguno';
        }
    }
}
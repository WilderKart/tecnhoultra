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
    const adminNameSpan = document.getElementById('admin-name');
    if (adminNameSpan) {
        adminNameSpan.textContent = user.nombre;
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = '../login.html';
        });
    }

    // Cargar los datos de la sección de clientes
    loadClientes();
}

// Función para obtener y mostrar los datos de los clientes (solicitudes de formulario)
async function loadClientes() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.accessToken : null;

    if (!token) {
        console.error('No hay token, no se pueden cargar los clientes.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/formulario', {
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
            throw new Error(errorData.error || 'Error al obtener los datos de los clientes.');
        }

        const clientes = await response.json();
        renderClientesTable(clientes);

    } catch (error) {
        console.error('Error en loadClientes:', error);
        const tableBody = document.getElementById('clientes-body');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center error-message">${error.message}</td></tr>`;
        }
    }
}

// Función para "pintar" la tabla de clientes en el HTML
function renderClientesTable(clientes) {
    const tableBody = document.getElementById('clientes-body');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

    if (clientes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay solicitudes de clientes registradas.</td></tr>';
        return;
    }

    clientes.forEach(cliente => {
        // Formatear la fecha a un formato legible
        const fecha = new
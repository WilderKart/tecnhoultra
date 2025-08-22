// login.js

// --- CONFIGURACIÓN DE API ---
const API_BASE_URL = '/api/auth'; // Base URL relativa

/**
 * Maneja el login de usuario
 * @param {Event} e - Evento submit del formulario
 */
async function handleLogin(e) {
    e.preventDefault();

    const loginError = document.getElementById('login-error');
    loginError.textContent = '';

    const correo = document.getElementById('login-user').value.trim();
    const contrasena = document.getElementById('login-pass').value;

    if (!correo || !contrasena) {
        loginError.textContent = 'Por favor, completa todos los campos.';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena }),
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar datos del usuario en localStorage
            localStorage.setItem('user', JSON.stringify(data));
            // Redirigir al panel de administración
            window.location.href = './html/admin.html';
        } else {
            loginError.textContent = data.message || 'Credenciales inválidas';
        }
    } catch (error) {
        console.error('Error de inicio de sesión:', error);
        loginError.textContent = 'No se pudo conectar con el servidor.';
    }
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Redirigir si ya hay un usuario logueado
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.accessToken) {
        window.location.href = './html/admin.html';
    }

    // 2. Asignar el handler al formulario
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// --- FUNCIÓN DE RESET PASSWORD ---
function resetPassword() {
    // Esta función requiere implementación en el backend
    alert('Funcionalidad de "Olvidé mi contraseña" aún no implementada.');
}

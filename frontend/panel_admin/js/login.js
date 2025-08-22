document.addEventListener('DOMContentLoaded', () => {
    // 1. Redirigir si ya hay un usuario logueado
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.accessToken) {
        // Redirigir a la ruta correcta del panel
        window.location.href = 'html/admin.html'; 
    }

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Limpiar errores previos
            loginError.textContent = '';

            // 2. Usar los IDs correctos de tu HTML
            const correo = document.getElementById('login-user').value.trim();
            const contrasena = document.getElementById('login-pass').value;

            if (!correo || !contrasena) {
                loginError.textContent = 'Por favor, completa todos los campos.';
                return;
            }

            try {
                // 3. Apuntar al endpoint correcto del backend
                const response = await fetch('http://localhost:3001/api/auth/signin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo, contrasena }) // El backend espera 'correo' y 'contrasena'
                });

                const data = await response.json();

                if (!response.ok) {
                    // Lanzar un error con el mensaje del backend
                    throw new Error(data.message || 'Credenciales inválidas');
                }
                
                // 4. Guardar la respuesta completa del backend en localStorage
                // La respuesta contiene: id, nombre, correo, rol, accessToken
                localStorage.setItem('user', JSON.stringify(data));
                
                // 5. Redirigir al panel de administración
                window.location.href = 'html/admin.html';

            } catch (error) {
                console.error('Error de inicio de sesión:', error);
                loginError.textContent = error.message;
            }
        });
    }
});

// 6. Mantener la función de reset, pero advertir que necesita backend
function resetPassword() {
    // Esta función es un placeholder. Para que funcione, necesitarías crear un endpoint en el backend
    // que maneje la lógica de reseteo de contraseña (generar un token, enviar un email, etc.)
    alert('Funcionalidad de "Olvidé mi contraseña" aún no implementada en el backend.');
}
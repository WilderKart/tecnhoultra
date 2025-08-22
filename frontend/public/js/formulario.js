// formulario.js

// --- CONFIGURACIÓN DE API ---
// Usamos una ruta relativa en lugar de absoluta.
// Así funcionará tanto en desarrollo como en producción si el backend está en el mismo dominio.
const API_BASE_URL = '/api/formulario';

/**
 * Formatea el valor de un input a moneda colombiana (COP).
 * Elimina cualquier caracter que no sea un dígito.
 * @param {HTMLInputElement} input - El elemento input a formatear.
 */
function formatCurrency(input) {
    if (!input) return;
    
    let value = input.value.replace(/\D/g, '');
    
    // Guardar el valor numérico limpio en un atributo data para uso futuro si es necesario
    input.setAttribute('data-value', value);

    if (value) {
        const formatted = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
        input.value = formatted;
    } else {
        input.value = '';
    }
}

/**
 * Formatea el valor de un input a un número de teléfono con espacios.
 * @param {HTMLInputElement} input - El elemento input a formatear.
 */
function formatPhone(input) {
    if (!input) return;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 3 && value.length <= 6) {
        value = value.replace(/(\d{3})(\d+)/, '$1 $2');
    } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
    }
    input.value = value;
}

/**
 * Maneja el envío del formulario.
 * @param {Event} e - El evento de submit.
 */
async function handleFormSubmit(e) {
    e.preventDefault(); // Evita recarga de la página

    const form = e.target;

    // Validación del checkbox de tratamiento de datos.
    const tratamiento = document.getElementById('tratamiento');
    if (!tratamiento || !tratamiento.checked) {
        alert('Debes aceptar el tratamiento de tus datos para continuar.');
        tratamiento?.focus();
        return;
    }

    // Recopilar datos del formulario
    const datos = {
        nombre_completo: document.getElementById('nombre')?.value.trim(),
        empresa: document.getElementById('empresa')?.value.trim(),
        correo: document.getElementById('correo')?.value.trim(),
        telefono: document.getElementById('telefono')?.value.trim(),
        sitio_web_o_redes: document.getElementById('sitio')?.value.trim(),
        tipo_negocio: document.getElementById('tipo-negocio')?.value,
        producto_principal: document.getElementById('producto')?.value.trim(),
        publico_objetivo: document.getElementById('publico')?.value.trim(),
        diferencial: document.getElementById('diferencia')?.value.trim(),
        comentarios: document.getElementById('detalles')?.value.trim(),
        rango_presupuesto: document.getElementById('presupuesto')?.value.trim(),
        fecha_limite: document.getElementById('fecha')?.value,
    };

    // Validación básica de campos obligatorios
    if (!datos.nombre_completo || !datos.correo || !datos.producto_principal) {
        alert('Por favor, completa los campos obligatorios: Nombre, Correo y Producto Principal.');
        return;
    }

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
        });

        const result = await response.json();

        if (response.ok) {
            alert('¡Gracias! Tu solicitud fue enviada con éxito.');
            form.reset();
        } else {
            alert('Error: ' + (result.error || 'No se pudo guardar el formulario.'));
        }
    } catch (error) {
        console.error('Error al enviar el formulario:', error);
        alert('No se pudo conectar con el servidor. Intenta más tarde.');
    }
}

// --- EVENT LISTENERS ---
// Se ejecuta cuando el DOM está completamente cargado.
document.addEventListener('DOMContentLoaded', () => {
    const miFormulario = document.getElementById('miFormulario');
    const presupuestoInput = document.getElementById('presupuesto');
    const telefonoInput = document.getElementById('telefono');

    // Listener para el envío del formulario.
    if (miFormulario) {
        miFormulario.addEventListener('submit', handleFormSubmit);
    }

    // Listener específico para el campo de presupuesto.
    if (presupuestoInput) {
        presupuestoInput.addEventListener('input', () => formatCurrency(presupuestoInput));
    }

    // Listener específico para el campo de teléfono.
    if (telefonoInput) {
        telefonoInput.addEventListener('input', () => formatPhone(telefonoInput));
    }
});

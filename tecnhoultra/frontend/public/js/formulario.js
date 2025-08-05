// formulario.js

// Formato de presupuesto en pesos colombianos (COP)
function formatCurrency(input) {
    let value = input.value.replace(/\D/g, '');
    if (value) {
        const formatted = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value);
        input.value = formatted; // Ej: $2.500.000
    } else {
        input.value = '';
    }
}

// Aplicar formato cuando el usuario escribe
document.getElementById('presupuesto').addEventListener('input', function () {
    // Guardamos el valor numérico limpio en un atributo data
    const rawValue = this.value.replace(/\D/g, '');
    this.setAttribute('data-value', rawValue);
    formatCurrency(this);
});

// Restaurar el valor numérico al enviar
document.getElementById('miFormulario').addEventListener('submit', async function (e) {
    e.preventDefault(); // Evita recarga

    const form = this;

    // Validación del checkbox
    const tratamiento = document.getElementById('tratamiento');
    if (!tratamiento.checked) {
        alert('Debes aceptar el tratamiento de tus datos para continuar.');
        tratamiento.focus();
        return;
    }

    // Recopilar datos del formulario
    const datos = {
        nombre_completo: document.getElementById('nombre').value.trim(),
        empresa: document.getElementById('empresa').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        sitio_web_o_redes: document.getElementById('sitio').value.trim(),
        tipo_negocio: document.getElementById('tipo-negocio').value,
        producto_principal: document.getElementById('producto').value.trim(),
        publico_objetivo: document.getElementById('publico').value.trim(),
        diferencial: document.getElementById('diferencia').value.trim(),
        comentarios: document.getElementById('detalles').value.trim(),
        rango_presupuesto: parseInt(document.getElementById('presupuesto').getAttribute('data-value')) || 0,
        fecha_limite: document.getElementById('fecha').value,
    };

    // Validación básica
    if (!datos.nombre_completo || !datos.correo || !datos.fecha_limite) {
        alert('Por favor, completa los campos obligatorios.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/formulario', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos),
        });

        const result = await response.json();

        if (response.ok) {
            alert('¡Gracias! Tu solicitud fue enviada con éxito.');
            form.reset(); // Limpia el formulario
            document.getElementById('presupuesto').value = ''; // Limpia el campo formateado
        } else {
            alert('Error: ' + (result.error || 'No se pudo guardar el formulario.'));
        }
    } catch (error) {
        console.error('Error al enviar el formulario:', error);
        alert('No se pudo conectar con el servidor. Intenta más tarde.');
    }
});

// Formato automático de teléfono
document.getElementById('telefono').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3 && value.length <= 6) {
        value = value.replace(/(\d{3})(\d+)/, '$1 $2');
    } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
    }
    e.target.value = value;
});

// Validación suave de correo
document.getElementById('correo').addEventListener('blur', function () {
    const email = this.value;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !regex.test(email)) {
        this.setCustomValidity('Por favor, ingresa un correo válido.');
    } else {
        this.setCustomValidity('');
    }
});
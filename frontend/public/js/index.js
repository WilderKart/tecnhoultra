// main.js
// Funcionalidades del sitio TechnoUltra

// Inicializar AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});

// Header fijo con scroll
window.addEventListener('scroll', function () {
    const header = document.getElementById('header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Newsletter popup (aparece después de 5 segundos)
setTimeout(() => {
    const popup = document.getElementById('newsletter-popup');
    if (!localStorage.getItem('newsletter-closed')) {
        popup.style.display = 'flex';
    }
}, 5000);

function closeNewsletter() {
    document.getElementById('newsletter-popup').style.display = 'none';
    localStorage.setItem('newsletter-closed', 'true');
}

// Validación de newsletter
document.getElementById('newsletter-form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('¡Gracias por suscribirte!');
    this.reset();
    closeNewsletter();
});

// Validación de contacto
document.getElementById('contact-form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Mensaje enviado. Nos pondremos en contacto contigo pronto.');
    this.reset();
});

// Modales legales
const modal = document.getElementById('legal-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

const contenidoLegal = {
    privacidad: `
        <h4>Aviso de Privacidad</h4>
        <p>TechnoUltra protege tus datos personales conforme a la Ley 1581 de 2012...</p>
    `,
    datos: `
        <h4>Política de Tratamiento de Datos</h4>
        <p>De acuerdo con la Ley 1581 de 2012 y el Decreto 1377 de 2013, informamos...</p>
    `,
    terminos: `
        <h4>Términos y Condiciones</h4>
        <p>Al usar este sitio, aceptas nuestras condiciones de uso y servicios...</p>
    `,
    cookies: `
        <h4>Política de Cookies</h4>
        <p>Utilizamos cookies para mejorar tu experiencia. Puedes gestionarlas en cualquier momento.</p>
    `
};

function openModal(type) {
    modal.style.display = 'block';
    modalTitle.textContent = document.querySelector(`[onclick="openModal('${type}')"]`).textContent;
    modalBody.innerHTML = contenidoLegal[type];
}

function closeModal() {
    modal.style.display = 'none';
}

// Cerrar modal al hacer clic fuera
window.onclick = function (event) {
    if (event.target === modal) {
        closeModal();
    }
};

// Carrusel automático de proyectos
const slider = document.querySelector('.projects-slider');
let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
});

slider.addEventListener('mouseleave', () => {
    isDown = false;
});

slider.addEventListener('mouseup', () => {
    isDown = false;
});

slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
});

// Auto-scroll suave
setInterval(() => {
    slider.scrollLeft += 2;
    if (slider.scrollLeft >= slider.scrollWidth / 2) {
        slider.scrollLeft = 0;
    }
}, 50);
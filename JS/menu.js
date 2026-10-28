document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.querySelector('.menu-section');
    if (!contenedor) return;

    let ultimaRespuesta = null;
    let cargando = false;
    let recargaPendiente = false;

    // Sincroniza el precio visible cuando cambia una opción (bebida, guarnición, etc.).
    contenedor.addEventListener('change', (event) => {
        if (event.target.matches('input[type="radio"][data-price]')) {
            updateCardPrice(event.target.closest('.menu-card'));
        }
    });

    async function cargarProductos() {
        if (cargando) {
            recargaPendiente = true;
            return;
        }
        cargando = true;

        do {
            recargaPendiente = false;
            try {
                const productos = await window.api.get('/productos');
                if (Array.isArray(productos)) {
                    const respuesta = JSON.stringify(productos);
                    if (respuesta !== ultimaRespuesta) {
                        ultimaRespuesta = respuesta;
                        if (productos.length > 0) {
                            renderProducts(productos, contenedor);
                            setupAddToCartButtons(contenedor);
                        } else {
                            // Una respuesta vacía de la base es un menú vacío, no el HTML de respaldo.
                            contenedor.innerHTML = '<p class="menu-empty">Por ahora no hay productos disponibles.</p>';
                        }
                    }
                }
            } catch (error) {
                console.warn('No se pudo cargar el menú desde la API; se conserva el contenido actual:', error.message);
            }
        } while (recargaPendiente);

        cargando = false;
    }

    // Un solo listener delegado sirve también después de refrescar las tarjetas.
    setupAddToCartButtons(contenedor);
    cargarProductos();
    window.onCatalogUpdated?.(cargarProductos);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) cargarProductos();
    });
});

const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
});

function escaparHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function updateCardPrice(card) {
    if (!card) return;
    const priceElement = card.querySelector('.menu-price');
    if (!priceElement) return;

    const selectedOption = card.querySelector('input[type="radio"]:checked');
    const price = Number(selectedOption ? selectedOption.dataset.price : card.dataset.price);
    if (!Number.isFinite(price)) return;

    priceElement.textContent = formatoCOP.format(price);
    priceElement.setAttribute('aria-live', 'polite');
}

function renderProducts(productos, contenedor) {
    if (!contenedor) return;
    contenedor.innerHTML = '';

    productos.forEach((producto) => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.dataset.id = producto.codigo;
        card.dataset.name = producto.nombre;
        card.dataset.price = producto.precio;

        const opciones = Array.isArray(producto.opciones) ? producto.opciones : [];
        let opcionesHtml = '';
        if (opciones.length > 0) {
            opcionesHtml = `<div class="guarnicion-options">${opciones
                .map((opcion, i) => {
                    const marcado = opcion.porDefecto || (i === 0 && !opciones.some((o) => o.porDefecto)) ? 'checked' : '';
                    return `<label><input type="radio" name="opcion-${producto.codigo}" value="${escaparHtml(opcion.nombre)}" data-price="${opcion.precio}" ${marcado}> ${escaparHtml(opcion.nombre)}</label>`;
                })
                .join('')}</div>`;
        }

        const imagenHtml = producto.imagen
            ? `<img src="${escaparHtml(producto.imagen)}" alt="${escaparHtml(producto.nombre)}">`
            : '';

        card.innerHTML = `
            ${imagenHtml}
            <h3>${escaparHtml(producto.nombre)}</h3>
            ${opcionesHtml}
            <p>${escaparHtml(producto.descripcion || '')}</p>
            <div class="menu-price">${formatoCOP.format(producto.precio)}</div>
            <button class="btn btn-add-to-cart">Agregar al Carrito</button>
        `;

        updateCardPrice(card);
        contenedor.appendChild(card);
    });
}

function setupAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');

    addToCartButtons.forEach(button => {
        if (button.dataset.cartHandlerAttached === 'true') return;
        button.dataset.cartHandlerAttached = 'true';
        button.addEventListener('click', (event) => {
            const card = event.target.closest('.menu-card');
            let product;

            // Revisa si la tarjeta tiene opciones de radio buttons seleccionadas
            const selectedOption = card.querySelector('input[type="radio"]:checked');
            const imageSrc = card.querySelector('img') ? card.querySelector('img').src : 'images/Logo.png'; // Obtiene la imagen o usa un logo por defecto

            if (selectedOption) {
                // Si hay una opción seleccionada (ej. Guarnición o Bebida)
                // Creamos un ID único para evitar que "Papas" y "Aros de Cebolla" se traten como el mismo producto.
                product = {
                    id: `${card.dataset.id}-${selectedOption.value.replace(/\s+/g, '-')}`,
                    codigo: card.dataset.id,
                    opcion: selectedOption.value,
                    name: selectedOption.value,
                    price: parseFloat(selectedOption.dataset.price),
                    quantity: 1,
                    image: imageSrc
                };
            } else {
                // Si es un producto simple (sin opciones de radio button)
                product = {
                    id: card.dataset.id,
                    codigo: card.dataset.id,
                    opcion: null,
                    name: card.dataset.name,
                    price: parseFloat(card.dataset.price),
                    quantity: 1,
                    image: imageSrc
                };
            }

            addToCart(product);

            // Feedback visual para el usuario
            button.textContent = '¡Agregado!';
            button.disabled = true;
            setTimeout(() => {
                button.textContent = 'Agregar al Carrito';
                button.disabled = false;
            }, 2000);
        });
    });
}

function addToCart(productToAdd) {
    // 1. Obtener el carrito de localStorage
    // Si no existe, inicializa como un array vacío
    let cart = JSON.parse(localStorage.getItem('flaminBiteCart')) || [];

    // 2. Revisar si el producto ya está en el carrito
    const existingProductIndex = cart.findIndex(item => item.id === productToAdd.id);

    if (existingProductIndex > -1) {
        // Si ya existe, solo aumenta la cantidad
        cart[existingProductIndex].quantity += 1;
    } else {
        // Si es nuevo, lo agrega al carrito
        cart.push(productToAdd);
    }

    // 3. Guardar el carrito actualizado en localStorage
    localStorage.setItem('flaminBiteCart', JSON.stringify(cart));

    // 4. Actualizar el contador del ícono del carrito
    // Disparamos un evento para que el contador en el header se actualice
    window.dispatchEvent(new Event('cart:updated'));
}

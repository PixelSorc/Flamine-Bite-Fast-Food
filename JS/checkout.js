document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.querySelector('.order-items');
    const form = document.getElementById('payment-form');
    const deliveryCost = 2000; // Costo de entrega fijo (debe coincidir con el backend)

    // Mostrar u ocultar detalles de la tarjeta
    const paymentOptions = document.querySelectorAll('input[name="pay"]');
    const cardDetails = document.getElementById('cardDetails');

    // Elementos del formulario para obtener datos del cliente
    const customerNameInput = document.getElementById('customer-name');
    const customerAddressInput = document.getElementById('customer-address');
    const customerEmailInput = document.querySelector('.contact-card input[type="email"]');
    const customerPhoneInput = document.querySelector('.contact-card input[type="tel"]');

    const formatoCOP = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    });

    paymentOptions.forEach(option => {
        option.addEventListener('change', () => {
            if (option.value === 'card') {
                cardDetails.style.display = 'block';
            } else {
                cardDetails.style.display = 'none';
            }
        });
    });

    // Función para calcular el subtotal del carrito
    function calculateSubtotal(cart) {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Rellena el resumen del pedido lateral con los productos del carrito
    function renderResumen() {
        const cart = JSON.parse(localStorage.getItem('flaminBiteCart')) || [];
        const subtotal = calculateSubtotal(cart);
        const total = subtotal + deliveryCost;

        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = cart.length
                ? cart.map(item => `
                    <li>
                        <span>${item.quantity}x ${item.name}</span>
                        <span>${formatoCOP.format(item.price * item.quantity)}</span>
                    </li>`).join('')
                : '<li><span>Tu carrito está vacío</span><span></span></li>';
        }

        const lineas = document.querySelectorAll('.totals .line span:nth-child(2)');
        if (lineas.length >= 3) {
            lineas[0].textContent = formatoCOP.format(subtotal);
            lineas[1].textContent = formatoCOP.format(deliveryCost);
            lineas[2].textContent = formatoCOP.format(total);
        }
    }

    renderResumen();

    // Manejo del envío del formulario de pago
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cart = JSON.parse(localStorage.getItem('flaminBiteCart')) || [];
        if (cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        const metodoSeleccionado = document.querySelector('input[name="pay"]:checked');

        // Enviamos el pedido a la API para que se guarde en MySQL.
        const payload = {
            customer_name: customerNameInput.value,
            customer_address: customerAddressInput.value,
            customer_email: customerEmailInput ? customerEmailInput.value : null,
            customer_phone: customerPhoneInput ? customerPhoneInput.value : null,
            metodo_pago: metodoSeleccionado ? metodoSeleccionado.value : null,
            // Solo enviamos el código y la opción; el backend recalcula los precios.
            items: cart.map(item => ({
                codigo: item.codigo || item.id,
                opcion: item.opcion || null,
                cantidad: item.quantity,
            })),
        };

        const boton = form.querySelector('button[type="submit"]');
        if (boton) boton.disabled = true;

        try {
            const respuesta = await window.api.post('/pedidos', payload);
            const codigo = respuesta?.pedido?.codigo;
            if (!codigo) throw new Error('El pedido se guardó, pero no recibimos su código de seguimiento.');

            // Limpiar el carrito y abrir el seguimiento privado del nuevo pedido.
            localStorage.removeItem('flaminBiteCart');
            window.dispatchEvent(new Event('cart:updated'));
            window.location.href = `seguimiento.html?codigo=${encodeURIComponent(codigo)}`;
        } catch (error) {
            alert('No se pudo procesar tu pedido: ' + error.message);
            if (boton) boton.disabled = false;
        }
    });
});

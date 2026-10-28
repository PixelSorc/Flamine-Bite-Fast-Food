document.addEventListener('DOMContentLoaded', () => {
    // Cargar y mostrar los productos del carrito al cargar la página
    renderCart();

    // Añadir listener para eliminar productos
    const cartItemsContainer = document.getElementById('cart-items-container');
    cartItemsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('quantity-change')) {
            const productId = event.target.dataset.id;
            const change = parseInt(event.target.dataset.change);
            updateQuantity(productId, change);
        }
    });

    // Añadir listener para el botón de reiniciar carrito
    const clearCartButton = document.getElementById('clear-cart');
    clearCartButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevenir que el enlace recargue la página
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            clearCart();
        }
    });

    function renderCart() {
        const cartItemsContainer = document.getElementById('cart-items-container');
        const cartTotalContainer = document.getElementById('cart-total-container');
        const cartTitle = document.getElementById('cart-title');
        cartItemsContainer.innerHTML = ''; // Limpiar el contenedor

        let cart = JSON.parse(localStorage.getItem('flaminBiteCart')) || [];
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Tu carrito está vacío. ¡Añade algo del menú!</p>';
            cartTitle.textContent = 'Carrito Vacío';
            cartTotalContainer.innerHTML = '';
            return;
        }

        cartTitle.textContent = 'Resumen de tu Pedido';

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            // Formatear precios a moneda local (ej. Colombiana)
            const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.price);
            const formattedItemTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(itemTotal);

            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item'); // Usamos una nueva clase para el nuevo estilo
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">${formattedPrice} c/u</span>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-change" data-id="${item.id}" data-change="-1">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-change" data-id="${item.id}" data-change="1">+</button>
                </div>
                <span class="cart-item-total">${formattedItemTotal}</span>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(total);
        cartTotalContainer.innerHTML = `
            <strong>Total</strong>
            <strong>${formattedTotal}</strong>
        `;
    }

    function updateQuantity(productId, change) {
        let cart = JSON.parse(localStorage.getItem('flaminBiteCart')) || [];
        const productIndex = cart.findIndex(item => item.id === productId);

        if (productIndex > -1) {
            cart[productIndex].quantity += change;

            // Si la cantidad llega a 0 o menos, eliminamos el producto
            if (cart[productIndex].quantity <= 0) {
                cart.splice(productIndex, 1);
            }

            localStorage.setItem('flaminBiteCart', JSON.stringify(cart));
            renderCart();
            window.dispatchEvent(new Event('cart:updated'));
        }
    }

    function clearCart() {
        localStorage.removeItem('flaminBiteCart');
        renderCart(); // Vuelve a dibujar el carrito, que ahora estará vacío        
        window.dispatchEvent(new Event('cart:updated')); // Actualiza el contador del header
    }
});

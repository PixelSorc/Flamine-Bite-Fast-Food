// Actualizar contador del carrito en el header
(function(){
    const KEY = 'flaminBiteCart';
    // Seleccionamos TODOS los elementos que tengan la clase 'cart-counter'
    const counters = document.querySelectorAll('.cart-counter');
    
    function updateCounters() {
        // Si no hay ningún contador en la página, no hacemos nada.
        if(!counters.length) return;
        
        try {
            const cart = JSON.parse(localStorage.getItem(KEY) || '[]');
            const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
            // Actualizamos cada contador y su etiqueta accesible.
            counters.forEach((counter) => {
                counter.textContent = total;
                const control = counter.closest('.btn-cart');
                if (control) {
                    const plural = total === 1 ? 'producto' : 'productos';
                    control.setAttribute('aria-label', `Carrito de compras: ${total} ${plural}`);
                    control.classList.toggle('has-items', total > 0);
                }
            });
        } catch(e) {
            counters.forEach(counter => counter.textContent = '0');
        }
    }

    // Actualizar al cargar la página
    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateCounters);
    } else {
        updateCounters();
    }

    // El evento storage actualiza otras pestañas; cart:updated actualiza esta pestaña.
    window.addEventListener('storage', function(e) {
        if (e.key === KEY) updateCounters();
    });
    window.addEventListener('cart:updated', updateCounters);
})();
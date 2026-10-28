// Lógica para los botones de ofertas especiales en index.html
document.addEventListener('DOMContentLoaded', () => {
    const btns = document.querySelectorAll('[data-oferta]');
    btns.forEach((btn) => {
        btn.addEventListener('click', async () => {
            const oferta = btn.getAttribute('data-oferta');
            try {
                const productos = await window.api.get('/productos');
                let items = [];
                if (oferta === 'familiar') {
                    const hamburguesa = productos.find((p) => /hamburguesa/i.test(p.nombre));
                    const papas = productos.find((p) => /papas? fritas/i.test(p.nombre));
                    const bebida = productos.find((p) => /limonada|refresco|bebida|gaseosa/i.test(p.nombre));

                    if (!hamburguesa || !papas || !bebida) {
                        alert('No se encontraron los productos de la oferta familiar en el menú. Por favor, completa el menú primero.');
                        return;
                    }

                    items = [
                        { codigo: hamburguesa.codigo, cantidad: 4 },
                        { codigo: papas.codigo, cantidad: 4 },
                        { codigo: bebida.codigo, cantidad: 4 },
                    ];
                } else if (oferta === 'estudiante') {
                    alert(
                        'Recuerda presentar tu identificación de estudiante en el momento de la entrega para aplicar el 10% de descuento. '
                        + 'Te redirigimos al menú para que armes tu pedido.'
                    );
                    window.location.href = 'menu.html';
                    return;
                }

                const cart = JSON.parse(localStorage.getItem('flaminBiteCart') || '[]');
                for (const item of items) {
                    const producto = productos.find((p) => p.codigo === item.codigo);
                    cart.push({
                        codigo: producto.codigo,
                        id: producto.codigo,
                        name: producto.nombre,
                        price: producto.precio,
                        quantity: item.cantidad,
                        opcion: null,
                    });
                }

                localStorage.setItem('flaminBiteCart', JSON.stringify(cart));
                window.dispatchEvent(new Event('cart:updated'));
                window.location.href = 'cart.html';
            } catch (error) {
                alert('No se pudo cargar la oferta. Verifica que el backend esté encendido e inténtalo de nuevo.');
                console.error('Error en oferta:', error);
            }
        });
    });
});

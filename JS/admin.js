// --- GUARDIÁN DE AUTENTICACIÓN ---
if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const orderList = document.getElementById('order-list');
    const productList = document.getElementById('product-list');
    const productForm = document.getElementById('product-form');
    const productMessage = document.getElementById('product-message');
    const categorySelect = document.getElementById('product-category');
    const submitButton = document.getElementById('product-submit');
    const cancelButton = document.getElementById('product-cancel');
    let productos = [];
    let productoEnEdicion = null;

    const formatoCOP = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    });
    const estadosPedido = [
        ['preparacion', 'En preparación'],
        ['listo', 'Listo'],
        ['en_camino', 'En camino'],
        ['entregado', 'Entregado'],
        ['cancelado', 'Cancelado'],
    ];
    const etiquetasEstado = {
        pendiente: 'En preparación',
        preparacion: 'En preparación',
        listo: 'Listo',
        en_camino: 'En camino',
        enviado: 'En camino',
        entregado: 'Entregado',
        cancelado: 'Cancelado',
    };

    function escaparHtml(texto) {
        return String(texto ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function mostrarMensaje(texto, tipo = '') {
        productMessage.textContent = texto;
        productMessage.className = tipo ? `is-${tipo}` : '';
    }

    function limpiarFormulario() {
        productoEnEdicion = null;
        productForm.reset();
        submitButton.textContent = 'Agregar producto';
        cancelButton.hidden = true;
    }

    async function loadProducts() {
        productList.innerHTML = '<p>Cargando productos...</p>';
        try {
            const data = await window.api.get('/productos/admin');
            productos = data.productos || [];

            categorySelect.replaceChildren(new Option('Sin categoría', ''));
            (data.categorias || []).forEach((categoria) => {
                categorySelect.add(new Option(categoria.nombre, String(categoria.id)));
            });

            if (productos.length === 0) {
                productList.innerHTML = '<p>No hay productos registrados.</p>';
                return;
            }

            productList.innerHTML = productos.map((producto) => {
                const activo = Number(producto.activo) === 1;
                const estado = activo ? 'Activo' : 'Inactivo (no aparece en el menú)';
                return `
                    <article class="product-item admin-product-item ${activo ? '' : 'is-inactive'}">
                        <div class="admin-product-item-main">
                            <strong>${escaparHtml(producto.nombre)}</strong>
                            <small> · ${escaparHtml(producto.codigo)} · ${escaparHtml(producto.categoria || 'Sin categoría')} · ${estado}</small>
                            <div>${formatoCOP.format(Number(producto.precio))}</div>
                            ${producto.descripcion ? `<small>${escaparHtml(producto.descripcion)}</small>` : ''}
                        </div>
                        <div class="product-item-actions">
                            <button class="btn btn-outline btn-edit-product" data-id="${Number(producto.id)}" type="button">Editar</button>
                            ${activo
                                ? `<button class="btn btn-secondary btn-deactivate-product" data-id="${Number(producto.id)}" type="button">Eliminar del menú</button>`
                                : `<button class="btn btn-secondary btn-reactivate-product" data-id="${Number(producto.id)}" type="button">Reactivar</button>`}
                        </div>
                    </article>`;
            }).join('');
        } catch (error) {
            productList.textContent = `Error al cargar productos: ${error.message}`;
        }
    }

    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        mostrarMensaje('');

        const body = {
            codigo: productForm.elements.codigo.value,
            nombre: productForm.elements.nombre.value,
            descripcion: productForm.elements.descripcion.value,
            precio: productForm.elements.precio.value,
            imagen: productForm.elements.imagen.value,
            categoria_id: categorySelect.value || null,
        };

        submitButton.disabled = true;
        try {
            if (productoEnEdicion) {
                await window.api.patch(`/productos/${productoEnEdicion}`, body);
                window.notifyCatalogUpdated?.();
                mostrarMensaje('Producto actualizado.', 'success');
            } else {
                await window.api.post('/productos', body);
                window.notifyCatalogUpdated?.();
                mostrarMensaje('Producto agregado al menú.', 'success');
            }
            limpiarFormulario();
            await loadProducts();
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    cancelButton.addEventListener('click', () => {
        limpiarFormulario();
        mostrarMensaje('Edición cancelada.');
    });

    productList.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-id]');
        if (!button) return;
        const id = Number(button.dataset.id);
        const producto = productos.find((item) => Number(item.id) === id);
        if (!producto) return;

        if (button.classList.contains('btn-edit-product')) {
            productoEnEdicion = id;
            productForm.elements.codigo.value = producto.codigo;
            productForm.elements.nombre.value = producto.nombre;
            productForm.elements.descripcion.value = producto.descripcion || '';
            productForm.elements.precio.value = producto.precio;
            productForm.elements.imagen.value = producto.imagen || '';
            categorySelect.value = producto.categoria_id ? String(producto.categoria_id) : '';
            submitButton.textContent = 'Guardar cambios';
            cancelButton.hidden = false;
            mostrarMensaje(`Editando: ${producto.nombre}`);
            productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
            productForm.elements.nombre.focus();
            return;
        }

        if (button.classList.contains('btn-deactivate-product')) {
            if (!window.confirm(`¿Eliminar “${producto.nombre}” del menú? Se conservará en la base de datos y en los pedidos históricos.`)) return;
            button.disabled = true;
            try {
                await window.api.delete(`/productos/${id}`);
                window.notifyCatalogUpdated?.();
                mostrarMensaje('Producto eliminado del menú.', 'success');
                await loadProducts();
            } catch (error) {
                mostrarMensaje(error.message, 'error');
                button.disabled = false;
            }
            return;
        }

        if (button.classList.contains('btn-reactivate-product')) {
            button.disabled = true;
            try {
                await window.api.patch(`/productos/${id}/estado`, { activo: true });
                window.notifyCatalogUpdated?.();
                mostrarMensaje('Producto reactivado y visible en el menú.', 'success');
                await loadProducts();
            } catch (error) {
                mostrarMensaje(error.message, 'error');
                button.disabled = false;
            }
        }
    });

    async function loadOrders() {
        orderList.innerHTML = '<p>Cargando pedidos...</p>';
        try {
            const orders = await window.api.get('/pedidos?estado=pendiente,preparacion,listo,en_camino,enviado');
            orderList.innerHTML = '';

            if (!orders || orders.length === 0) {
                orderList.innerHTML = '<p>No hay pedidos para mostrar.</p>';
                return;
            }

            orders.forEach((order) => {
                const orderElement = document.createElement('article');
                orderElement.className = 'product-item admin-order-item';
                const orderDate = new Date(order.creado_en).toLocaleString('es-CO');
                const details = (order.items || [])
                    .map((item) => `${item.cantidad}x ${item.nombre}`)
                    .join(', ');
                const estadoActual = order.estado === 'enviado'
                    ? 'en_camino'
                    : order.estado === 'pendiente' ? 'preparacion' : order.estado;
                const etiquetaEstado = etiquetasEstado[estadoActual] || estadoActual;

                orderElement.innerHTML = `
                    <div class="admin-order-main">
                        <strong>Cliente:</strong> ${escaparHtml(order.cliente_nombre)}<br>
                        <strong>Dirección:</strong> ${escaparHtml(order.cliente_direccion || '—')}<br>
                        <strong>Pedido:</strong> ${escaparHtml(details)}<br>
                        <small>Código: ${escaparHtml(order.codigo)} · ${escaparHtml(orderDate)} · Total: ${formatoCOP.format(Number(order.total))}</small>
                        <p class="admin-order-current-status">Estado actual: <strong>${escaparHtml(etiquetaEstado)}</strong></p>
                    </div>
                    <div class="order-actions admin-order-status-actions">
                        <label>
                            Actualizar estado
                            <select class="order-status-select" data-id="${Number(order.id)}">
                                ${estadosPedido.map(([value, label]) => `<option value="${value}" ${estadoActual === value ? 'selected' : ''}>${label}</option>`).join('')}
                            </select>
                        </label>
                        <button class="btn btn-outline btn-update-order-status" data-id="${Number(order.id)}" type="button">Guardar estado</button>
                    </div>`;
                orderList.appendChild(orderElement);
            });
        } catch (error) {
            orderList.textContent = `Error al cargar los pedidos: ${error.message}`;
        }
    }

    orderList.addEventListener('click', async (event) => {
        const button = event.target.closest('.btn-update-order-status');
        if (!button) return;
        const select = orderList.querySelector(`.order-status-select[data-id="${button.dataset.id}"]`);
        if (!select) return;

        button.disabled = true;
        try {
            await window.api.patch(`/pedidos/${button.dataset.id}/estado`, { estado: select.value });
            await loadOrders();
        } catch (error) {
            alert(`No se pudo actualizar el pedido: ${error.message}`);
            button.disabled = false;
        }
    });

    loadProducts();
    loadOrders();
});

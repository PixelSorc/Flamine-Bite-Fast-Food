document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('drink-option-form');
    const productSelect = document.getElementById('drink-parent-product');
    const nameInput = document.getElementById('drink-option-name');
    const priceInput = document.getElementById('drink-option-price');
    const submitButton = document.getElementById('drink-option-submit');
    const message = document.getElementById('drink-option-message');
    const optionList = document.getElementById('drink-option-list');
    let beverageProducts = [];
    let beverageOptions = [];

    const formatCOP = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    });

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setMessage(text, type = '') {
        message.textContent = text;
        message.className = type ? `admin-status-message is-${type}` : 'admin-status-message';
    }

    function renderOptions() {
        if (beverageOptions.length === 0) {
            optionList.innerHTML = '<p>No hay bebidas agregadas a esta sección todavía.</p>';
            return;
        }

        optionList.innerHTML = beverageOptions.map((option) => `
            <article class="product-item drink-option-item">
                <div class="admin-product-item-main">
                    <strong>${escapeHtml(option.nombre)}</strong>
                    <small> · ${escapeHtml(option.producto_nombre)}</small>
                    <span class="drink-option-price">${formatCOP.format(Number(option.precio))}</span>
                </div>
                <div class="product-item-actions">
                    <button class="btn btn-secondary btn-remove-drink-option"
                            data-product-id="${Number(option.producto_id)}"
                            data-option-id="${Number(option.id)}"
                            type="button">Quitar de bebidas</button>
                </div>
            </article>`).join('');
    }

    async function loadBeverageOptions() {
        optionList.innerHTML = '<p>Cargando bebidas...</p>';
        try {
            const data = await window.api.get('/productos/admin');
            beverageProducts = (data.productos || []).filter((product) =>
                Number(product.activo) === 1 && String(product.categoria || '').toLocaleLowerCase('es') === 'bebidas'
            );

            const previousProductId = productSelect.value;
            productSelect.replaceChildren();
            beverageProducts.forEach((product) => {
                productSelect.add(new Option(product.nombre, String(product.id)));
            });

            const hasBeverageSection = beverageProducts.length > 0;
            productSelect.disabled = !hasBeverageSection;
            nameInput.disabled = !hasBeverageSection;
            priceInput.disabled = !hasBeverageSection;
            submitButton.disabled = !hasBeverageSection;

            if (!hasBeverageSection) {
                optionList.innerHTML = '<p>No hay una sección activa con categoría “Bebidas”. Activa o crea primero ese producto del menú.</p>';
                return;
            }
            if (beverageProducts.some((product) => String(product.id) === previousProductId)) {
                productSelect.value = previousProductId;
            }

            const beverageIds = new Set(beverageProducts.map((product) => Number(product.id)));
            beverageOptions = (data.opciones || []).filter((option) => beverageIds.has(Number(option.producto_id)));
            renderOptions();
        } catch (error) {
            optionList.textContent = `Error al cargar bebidas: ${error.message}`;
            productSelect.disabled = true;
            nameInput.disabled = true;
            priceInput.disabled = true;
            submitButton.disabled = true;
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setMessage('');
        const productId = productSelect.value;
        if (!productId) {
            setMessage('Selecciona la sección de bebidas.', 'error');
            return;
        }

        submitButton.disabled = true;
        try {
            await window.api.post(`/productos/${productId}/opciones`, {
                nombre: nameInput.value,
                precio: priceInput.value,
            });
            window.notifyCatalogUpdated?.();
            nameInput.value = '';
            priceInput.value = '';
            setMessage('Bebida agregada a la tarjeta del menú.', 'success');
            await loadBeverageOptions();
        } catch (error) {
            setMessage(error.message, 'error');
        } finally {
            submitButton.disabled = beverageProducts.length === 0;
        }
    });

    optionList.addEventListener('click', async (event) => {
        const button = event.target.closest('.btn-remove-drink-option');
        if (!button) return;
        const productId = Number(button.dataset.productId);
        const optionId = Number(button.dataset.optionId);
        const option = beverageOptions.find((item) => Number(item.id) === optionId);
        if (!option || !window.confirm(`¿Quitar “${option.nombre}” de la tarjeta de bebidas?`)) return;

        button.disabled = true;
        try {
            await window.api.delete(`/productos/${productId}/opciones/${optionId}`);
            window.notifyCatalogUpdated?.();
            setMessage('Bebida quitada de la tarjeta.', 'success');
            await loadBeverageOptions();
        } catch (error) {
            setMessage(error.message, 'error');
            button.disabled = false;
        }
    });

    loadBeverageOptions();
});

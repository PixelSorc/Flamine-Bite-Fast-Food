document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tracking-form');
    const codeInput = document.getElementById('tracking-code');
    const resultPanel = document.getElementById('tracking-result');
    const feedback = document.getElementById('tracking-feedback');
    const codeDisplay = document.getElementById('tracking-code-display');
    const statusMessage = document.getElementById('tracking-status-message');
    const timeline = document.getElementById('tracking-timeline');
    const updatedLabel = document.getElementById('tracking-updated');
    const refreshButton = document.getElementById('tracking-refresh');

    const stages = [
        { code: 'preparacion', title: 'En preparación', detail: 'El restaurante está preparando tu pedido.' },
        { code: 'listo', title: 'Listo', detail: 'Tu pedido está listo para salir.' },
        { code: 'en_camino', title: 'En camino', detail: 'Tu pedido va hacia la dirección indicada.' },
        { code: 'entregado', title: 'Entregado', detail: 'El pedido llegó a su destino. ¡Buen provecho!' },
    ];

    let currentCode = '';
    let refreshTimer = null;
    let requestInFlight = false;

    function setFeedback(text, isError = false) {
        feedback.textContent = text;
        feedback.classList.toggle('is-error', isError);
    }

    function renderOrder(order) {
        const state = order.estado === 'pendiente' ? 'preparacion' : order.estado;
        const canonicalState = state === 'enviado' ? 'en_camino' : state;
        const currentIndex = stages.findIndex((stage) => stage.code === canonicalState);

        resultPanel.hidden = false;
        resultPanel.classList.toggle('is-cancelled', canonicalState === 'cancelado');
        codeDisplay.textContent = order.codigo;

        if (canonicalState === 'cancelado') {
            statusMessage.textContent = 'Este pedido fue cancelado. Si necesitas ayuda, contáctanos.';
            timeline.innerHTML = '';
            updatedLabel.textContent = '';
            stopAutoRefresh();
            return;
        }

        if (currentIndex < 0) {
            statusMessage.textContent = 'Recibimos tu pedido. Estamos consultando su estado.';
            timeline.innerHTML = '';
            return;
        }

        statusMessage.textContent = stages[currentIndex].detail;
        timeline.innerHTML = stages.map((stage, index) => {
            const className = index < currentIndex ? 'is-done' : index === currentIndex ? 'is-current' : '';
            const marker = index < currentIndex ? '✓' : String(index + 1);
            const current = index === currentIndex ? ' aria-current="step"' : '';
            return `
                <li class="tracking-step ${className}"${current}>
                    <span class="tracking-step-marker" aria-hidden="true">${marker}</span>
                    <div>
                        <strong>${stage.title}</strong>
                        <small>${stage.detail}</small>
                    </div>
                </li>`;
        }).join('');

        if (order.creado_en) {
            const created = new Date(order.creado_en);
            updatedLabel.textContent = `Pedido recibido: ${created.toLocaleString('es-CO')}. El estado se actualiza automáticamente.`;
        }
        if (canonicalState === 'entregado') stopAutoRefresh();
    }

    function stopAutoRefresh() {
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = null;
    }

    function startAutoRefresh() {
        stopAutoRefresh();
        refreshTimer = setInterval(() => {
            if (currentCode && !document.hidden) consultOrder(currentCode, true);
        }, 15000);
    }

    async function consultOrder(code, silent = false) {
        if (requestInFlight) return;
        requestInFlight = true;
        if (!silent) setFeedback('Consultando el estado del pedido…');

        try {
            const order = await window.api.get(`/pedidos/seguimiento/${encodeURIComponent(code)}`);
            currentCode = order.codigo;
            codeInput.value = order.codigo;
            renderOrder(order);
            setFeedback('');
            if (order.estado !== 'entregado' && order.estado !== 'cancelado') startAutoRefresh();
        } catch (error) {
            setFeedback(error.message || 'No encontramos ese pedido. Revisa el código e inténtalo de nuevo.', true);
            if (!silent) resultPanel.hidden = true;
        } finally {
            requestInFlight = false;
        }
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const code = codeInput.value.trim().toUpperCase();
        consultOrder(code);
    });

    refreshButton.addEventListener('click', () => {
        if (currentCode) consultOrder(currentCode);
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && currentCode) consultOrder(currentCode, true);
    });

    const codeFromUrl = new URLSearchParams(window.location.search).get('codigo');
    if (codeFromUrl) {
        codeInput.value = codeFromUrl.toUpperCase();
        consultOrder(codeInput.value);
    }
});

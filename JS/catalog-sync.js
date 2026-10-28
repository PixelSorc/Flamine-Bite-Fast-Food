// Sincronización del catálogo entre pestañas del mismo navegador.
(function () {
    const eventName = 'flamin:catalog-updated';
    const storageKey = 'flaminBiteCatalogUpdated';
    const channel = typeof BroadcastChannel === 'function'
        ? new BroadcastChannel('flamin-bite-catalog')
        : null;

    function notifyListeners() {
        window.dispatchEvent(new Event(eventName));
    }

    if (channel) {
        channel.addEventListener('message', (event) => {
            if (event.data?.type === 'catalog-updated') notifyListeners();
        });
    } else {
        window.addEventListener('storage', (event) => {
            if (event.key === storageKey) notifyListeners();
        });
    }

    window.onCatalogUpdated = (callback) => {
        window.addEventListener(eventName, callback);
    };

    window.notifyCatalogUpdated = () => {
        if (channel) {
            channel.postMessage({ type: 'catalog-updated' });
            return;
        }

        try {
            localStorage.setItem(storageKey, `${Date.now()}-${Math.random()}`);
        } catch (error) {
            console.warn('No se pudo notificar el cambio del menú:', error.message);
        }
    };
})();

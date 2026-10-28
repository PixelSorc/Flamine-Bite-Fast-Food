// Cliente ligero para comunicarse con la API REST del backend.
// Expone el objeto global `api` con los métodos get, post y patch.

(function () {
    // Si el sitio se sirve desde Express, la API está en el mismo origen.
    // Puedes sobreescribirlo (p. ej. con Live Server) definiendo antes:
    //   <script>window.FLAMIN_API_BASE = 'http://localhost:3000/api';</script>
    const API_BASE = window.FLAMIN_API_BASE || '/api';

    async function request(path, options = {}) {
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        };

        const token = sessionStorage.getItem('flaminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (options.body !== undefined) {
            config.body = JSON.stringify(options.body);
        }

        let respuesta;
        try {
            respuesta = await fetch(API_BASE + path, config);
        } catch (error) {
            throw new Error('No se pudo conectar con el servidor. ¿Está el backend en ejecución?');
        }

        const data = await respuesta.json().catch(() => ({}));

        if (!respuesta.ok) {
            // Si el token expiró o no es válido, cerramos la sesión.
            if (respuesta.status === 401) {
                sessionStorage.removeItem('isLoggedIn');
                sessionStorage.removeItem('flaminToken');
            }
            throw new Error(data.error || `Error ${respuesta.status}`);
        }

        return data;
    }

    window.api = {
        base: API_BASE,
        get: (path) => request(path),
        post: (path, body) => request(path, { method: 'POST', body }),
        patch: (path, body) => request(path, { method: 'PATCH', body }),
        delete: (path) => request(path, { method: 'DELETE' }),
    };
})();

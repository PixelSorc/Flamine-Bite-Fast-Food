document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    // El elemento para el mensaje de error ya está en el HTML.
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        errorMessage.style.display = 'none'; // Ocultar errores previos

        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            // Las credenciales se validan en el backend contra la tabla
            // `administradores` de MySQL.
            const respuesta = await window.api.post('/auth/login', { username, password });

            // 1. Guardamos la sesión y el token.
            // sessionStorage solo dura mientras la pestaña del navegador esté abierta.
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('flaminToken', respuesta.token);
            sessionStorage.setItem('flaminUser', respuesta.usuario);

            // 2. Redirigimos al panel de administración.
            window.location.href = 'admin.html';
        } catch (error) {
            // Si las credenciales son incorrectas o el servidor falla:
            errorMessage.textContent = error.message || 'Usuario o contraseña incorrectos.';
            errorMessage.style.display = 'block';
        }
    });
});

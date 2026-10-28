# 🔥 Flamin' Bite — Fast Food

Sitio web para el restaurante de comida rápida **Flamin' Bite**, una marca de hamburguesas, tacos y burritos con sabores intensos y picantes. Incluye menú conectado a MySQL, carrito, checkout, páginas informativas, panel de administración, **seguimiento público de pedidos** y **ofertas funcionales** desde el inicio.

El proyecto tiene un **frontend estático** (HTML, CSS y JavaScript vanilla) y un **backend REST con Node.js, Express y MySQL** que gestiona el catálogo de productos, los pedidos y la autenticación del administrador.

---

## 📋 Características

- **Inicio** con sección principal, comidas populares y ofertas funcionales: el botón **Ordenar Ahora** lleva al menú, **Ver Oferta** agrega automáticamente productos al carrito o muestra información relevante.
- **Menú conectado a MySQL**: muestra los productos activos y sus opciones. Si la API no está disponible conserva el HTML de respaldo; si la base devuelve cero productos muestra un estado vacío. El precio visible cambia al seleccionar una opción.
- **Bebidas y gaseosas** como opciones de la tarjeta “Para apagar el Fuego (Bebidas)”. Las opciones se administran en MySQL junto con su precio; al guardarlas o quitarlas, las pestañas abiertas del menú se sincronizan y muestran el cambio.
- **Carrito** con contador actualizado al agregar productos, modificar cantidades o vaciarlo; conserva el total en COP.
- **Checkout** con datos de contacto, dirección de envío, resumen y métodos de pago: Nequi, Daviplata, Bancolombia, Movii, tarjeta y efectivo.
- **Seguimiento del pedido** después de comprar: el cliente recibe un código privado y puede consultar si está en preparación, listo, en camino o entregado.
- **Panel de administración protegido**: agregar, editar y ocultar/reactivar productos; administrar bebidas y cambiar el estado de los pedidos.
- **Contacto** con una sección principal adaptable y accesos al formulario y a los canales de contacto. El formulario actualmente muestra una confirmación local; todavía no envía ni almacena mensajes.
- **Páginas informativas**: Sobre Nosotros y Ubicaciones.
- **Diseño responsive** para páginas de menú, administración, seguimiento y contacto.

---

## 🧰 Tecnologías

| Ámbito | Tecnología |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Node.js + Express 5 |
| Base de datos | MySQL 8 (driver `mysql2`) |
| Otros | CORS, `crypto` de Node (hash de contraseñas y tokens) |

---

## 📁 Estructura del proyecto

```
Flamin_ Bite fast food/
├── database/
│   ├── schema.sql          # Esquema de MySQL + datos semilla
│   └── migrations/
│       └── 001_order_tracking_statuses.sql # Estados para seguimiento de pedidos
├── routes/
│   ├── productos.js        # Menú público y administración de productos/opciones
│   ├── pedidos.js          # POST / GET / PATCH /api/pedidos
│   └── auth.js             # POST /api/auth/login
├── tests/                  # Pruebas con node:test (sin dependencias extra)
├── utils/
│   ├── auth.js             # Hash scrypt, tokens HMAC y middleware requireAuth
│   ├── product-validation.js # Validación de productos
│   ├── product-option-validation.js # Validación de opciones de bebidas
│   └── order-tracking.js    # Códigos y estados de seguimiento
├── scripts/
│   ├── init-db.js          # Ejecuta database/schema.sql (npm run db:init)
│   ├── migrate-order-tracking.js # Aplica la migración de estados
│   └── hash-password.js    # Genera el hash de una contraseña de admin
├── CSS/                    # Estilos por página (incluye tracking.css y cart-header.css)
├── JS/
│   ├── api.js              # Cliente fetch hacia la API REST
│   ├── catalog-sync.js     # Sincroniza cambios de catálogo entre pestañas
│   ├── cart-counter.js     # Contador instantáneo del carrito
│   ├── menu.js             # Menú dinámico, precios de opciones y carrito
│   ├── cart.js             # Renderizado y edición del carrito
│   ├── checkout.js         # Envía el pedido a la API
│   ├── login.js            # Autenticación del administrador
│   ├── admin.js            # Administración de productos y pedidos
│   ├── admin-drinks.js     # Opciones de bebidas y gaseosas
│   ├── tracking.js         # Consulta del estado del pedido
│   └── ofertas.js          # Lógica de botones de ofertas especiales
├── images/                 # Logotipos, fotos de productos y medios de pago
├── index.html              # Página de inicio
├── menu.html               # Catálogo de productos
├── cart.html               # Carrito de compras
├── checkout.html           # Finalizar compra / pago
├── seguimiento.html        # Seguimiento público del pedido
├── ubicaciones.html        # Sedes del restaurante
├── about.html              # Sobre Nosotros
├── contacto.html           # Contacto
├── login.html              # Acceso de administrador
├── admin.html              # Panel de administración
├── config.js               # Configuración (lectura de .env)
├── db.js                   # Pool de conexiones MySQL
├── index.js                # Servidor Express (API + sitio estático)
├── .env.example            # Plantilla de variables de entorno
├── package.json
└── README.md
```

---

## 🚀 Instalación y puesta en marcha

### 1. Requisitos

- Node.js 18 o superior.
- MySQL 8 en ejecución.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar las variables de entorno

Copia `.env.example` a `.env` y ajusta tus credenciales de MySQL:

```bash
copy .env.example .env      # Windows
# cp .env.example .env      # Linux / macOS
```

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=flamine_bite
AUTH_SECRET=cambia-esta-clave-secreta
DELIVERY_COST=2000
```

### 4. Crear la base de datos y los datos semilla

```bash
npm run db:init
```

> Este comando ejecuta `database/schema.sql` usando las credenciales del `.env` (no necesita el cliente `mysql` instalado). Como alternativa puedes ejecutarlo manualmente con `mysql -u root -p < database/schema.sql` o desde MySQL Workbench.
>
> El script es idempotente: crea la base `flamine_bite`, las tablas y los datos semilla (categorías, productos, opciones y el administrador por defecto). Puede ejecutarse varias veces sin duplicar registros.

### 5. Iniciar el servidor

```bash
npm start        # producción
npm run dev      # con recarga automática (node --watch)
```

Abre **http://localhost:3000** en el navegador. El sitio y la API se sirven desde el mismo origen.

---

## 🔌 API REST

|| Método | Ruta | Descripción | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Estado del servidor y de la conexión a MySQL | No |
| `GET` | `/api/productos` | Lista los productos activos con sus opciones | No |
| `GET` | `/api/productos/admin` | Lista productos, categorías y opciones para administración | Sí |
| `POST` | `/api/productos` | Agrega un producto activo | Sí |
| `PATCH` | `/api/productos/:id` | Edita los datos de un producto | Sí |
| `DELETE` | `/api/productos/:id` | Lo oculta del menú sin borrar pedidos históricos | Sí |
| `PATCH` | `/api/productos/:id/estado` | Activa o reactiva un producto | Sí |
| `POST` | `/api/productos/:id/opciones` | Agrega una bebida o gaseosa dentro de la tarjeta de bebidas | Sí |
| `DELETE` | `/api/productos/:id/opciones/:opcionId` | Quita una bebida de la tarjeta | Sí |
| `POST` | `/api/pedidos` | Registra un nuevo pedido | No |
| `GET` | `/api/pedidos/seguimiento/:codigo` | Consulta pública del estado del pedido por código | No |
| `GET` | `/api/pedidos?estado=pendiente` | Lista los pedidos con sus ítems | Sí |
| `PATCH` | `/api/pedidos/:id/estado` | Cambia el estado de un pedido | Sí |
| `POST` | `/api/auth/login` | Valida las credenciales y devuelve un token | No |

Las rutas protegidas requieren la cabecera `Authorization: Bearer <token>`.

### Ejemplo — crear un pedido

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Ana Pérez",
    "customer_address": "Calle 10 #20-30",
    "customer_email": "ana@correo.com",
    "customer_phone": "+57 300 000 0000",
    "metodo_pago": "nequi",
    "items": [
      { "codigo": "prod-001", "cantidad": 1 },
      { "codigo": "prod-008", "opcion": "Aros de Cebolla", "cantidad": 2 }
    ]
  }'
```

> **Nota de seguridad:** el backend **recalcula los precios en la base de datos** a partir del código del producto y la opción. No confía en los precios enviados por el cliente.

---

## 🔑 Acceso al panel de administración

Desde `login.html`, usa las credenciales por defecto:

| Campo | Valor |
| --- | --- |
| Usuario | `admin` |
| Contraseña | `12345` |

La contraseña se almacena **hasheada con scrypt** en la tabla `administradores`. Para cambiarla, genera un nuevo hash y actualízalo:

```bash
npm run hash-password "mi-nueva-contraseña"
# Copia el UPDATE que imprime el script y ejecútalo en MySQL.
```

Ruta de acceso: `login.html` → `admin.html`. El panel está protegido: si no hay sesión activa, redirige al login, y la API rechaza las peticiones sin token válido.

Dentro de **Administrar productos del menú**, usa **Administrar bebidas y gaseosas** para elegir la sección activa de categoría `Bebidas`, agregar una opción con su precio o quitarla. Se guarda en `producto_opciones`; al guardar o quitar, las pestañas abiertas del menú reciben el cambio. Al seleccionar una bebida, el precio de la tarjeta y del carrito se actualiza al precio de esa opción.

La eliminación del producto padre es una desactivación (conserva los pedidos); quitar una bebida elimina esa opción de la sección.

---

## 🗄️ Esquema de la base de datos

| Tabla | Contenido |
| --- | --- |
| `categorias` | Categorías del menú (Hamburguesas, Tacos, Burritos, etc.) |
| `productos` | Productos con código, nombre, descripción, precio, imagen y categoría |
| `producto_opciones` | Opciones de un producto (guarniciones, bebidas) con su precio |
| `pedidos` | Cabecera del pedido: cliente, método de pago, totales, estado y fecha |
| `pedido_items` | Detalle de los productos de cada pedido |
| `administradores` | Usuarios del panel admin con contraseña hasheada |

El carrito de compras se mantiene en `localStorage` del navegador hasta que el cliente confirma el pedido; en ese momento se envía a la API y se guarda en MySQL.

---

## 🗺️ Flujo de compra

1. El usuario abre **Menú**; `GET /api/productos` carga productos activos y opciones desde MySQL.
2. Al elegir una guarnición o bebida, el precio mostrado se actualiza al precio de esa opción. **Agregar al Carrito** guarda la opción y ese mismo precio; el contador se actualiza inmediatamente.
3. En el carrito puede cambiar cantidades o quitar artículos; el contador y el total se actualizan.
4. En checkout ingresa sus datos y confirma. `POST /api/pedidos` vuelve a calcular los precios desde MySQL y redirige al **seguimiento** con un código privado.
5. El administrador entra desde `login.html`. En `admin.html` gestiona productos, opciones de bebidas/gaseosas y pedidos. Los cambios del catálogo se notifican a las pestañas de menú abiertas en el mismo navegador.
6. En el **inicio**, las ofertas especiales pueden agregar productos al carrito automáticamente o redirigir al menú para completar el pedido.

### Pruebas automatizadas

El proyecto usa el ejecutor integrado de Node.js (`node:test`); no requiere instalar un framework de pruebas:

```bash
node --test
```

La suite cubre validación de productos y opciones, actualización de precios, contador del carrito, sincronización del catálogo, seguimiento de pedidos y enlaces principales.

---

## 🛣️ Roadmap / Mejoras sugeridas

- [ ] Persistir el carrito por sesión de usuario en la base de datos.
- [x] Administración de productos y opciones de bebidas/gaseosas desde el panel.
- [ ] Edición de categorías desde el panel de administración.
- [ ] Integración real con pasarelas de pago (Nequi, Daviplata, tarjetas).
- [ ] Envío y persistencia del formulario de contacto y newsletter.
- [ ] Validación de formularios más estricta y rate limiting.
- [ ] Ampliar las pruebas automatizadas con más casos de integración.

---

## 🔐 Notas de seguridad

- El archivo `.env` está excluido del control de versiones mediante `.gitignore`.
- Las contraseñas se guardan con **scrypt** y se comparan en tiempo constante.
- Los tokens de sesión se firman con **HMAC-SHA256** y expiran automáticamente.
- El servidor solo expone los archivos del frontend (HTML, CSS, JS e imágenes); no sirve el código del backend.

---

## 📄 Licencia

ISC. Consulta el archivo `package.json` para más detalles.

---

© 2024 Flamin' Bite. Todos los derechos reservados.

# 🏆 Patagonia Sports — E-commerce Full Stack

Proyecto final de la **Diplomatura Full Stack ICARO**, migrado desde un stack legacy (Express + Sequelize + React CRA) a una arquitectura moderna y desacoplada.

Aplicación de indumentaria deportiva con catálogo, carrito, checkout con Mercado Pago, autenticación JWT y panel de administración.

---

## 🚀 Stack tecnológico

### Backend (`/backend`) — puerto 3030

| Tecnología | Uso |
|---|---|
| **NestJS 10** | Framework modular |
| **Prisma ORM 6** | Acceso a MariaDB/MySQL |
| **MariaDB** (`icarodb`) | Base de datos |
| **Passport + JWT** | Autenticación (cookie httpOnly) |
| **class-validator / class-transformer** | Validación de DTOs |
| **Mercado Pago SDK** | Preferencias + webhook |
| **Multer** | Subida de imágenes |
| **Nodemailer** | Verificación de cuentas por email |

### Frontend (`/frontend`) — puerto 3000

| Tecnología | Uso |
|---|---|
| **Next.js 16** (App Router) | Framework React con Server Components |
| **React 19 + TypeScript** | UI |
| **Tailwind CSS 4** | Estilos |
| **lucide-react** | Iconografía |
| **sonner** | Toasts |
| **sweetalert2** | Modales y confirmaciones |

---

## 🗂️ Estructura del proyecto

```
.
├─ backend/
│  ├─ prisma/            # schema, migraciones y seed
│  ├─ assets/images/     # imágenes de productos (estáticas)
│  └─ src/
│     ├─ auth/           # login/register/verify-email/logout/me + JWT
│     ├─ users/          # perfil, datos personales y libreta de direcciones
│     ├─ products/       # CRUD + variantes + subida de imagen
│     ├─ categories/
│     ├─ orders/         # creación con descuento de stock
│     ├─ payments/       # Mercado Pago (preference + webhook)
│     ├─ reviews/        # reseñas y valoraciones (compra aprobada)
│     ├─ questions/      # preguntas de clientes y respuestas admin
│     ├─ mail/           # Nodemailer (verificación de cuentas)
│     ├─ reservations/   # reservas temporales de stock del carrito
│     ├─ prisma/         # PrismaService
│     └─ common/         # guards, decoradores, interfaces
├─ frontend/
│  └─ src/
│     ├─ app/            # rutas App Router
│     ├─ components/     # UI, catálogo, admin, checkout
│     ├─ context/        # carrito y auth
│     ├─ lib/            # API client, tipos, formato
│     └─ proxy.ts        # protección de rutas (Next 16)
├─ .opencode/            # AGENTS.md, memory.md, plan.md, ROADMAP.md
├─ .env.template
└─ README.md
```

---

## ✨ Funcionalidades

- **Catálogo** `/productos` con filtros por categoría, búsqueda, rango de precios y orden (Server Components + Suspense).
- **Variantes por producto** (talle/color) con stock individual; el stock total es la suma de las variantes.
- **Carrito** persistente en `localStorage` con validación de stock, reservas temporales de 10 minutos y toasts.
- **Checkout** con Mercado Pago Checkout Pro:
  - creación de orden + descuento de stock,
  - generación de preferencia,
  - redirección a `init_point`,
  - páginas de resultado `/checkout/success|failure|pending`.
- **Autenticación** con JWT en cookie httpOnly y roles `ADMIN` / `CLIENT`.
- **Verificación de email** obligatoria antes del primer login (token + Nodemailer).
- **Perfil del cliente** `/profile`: datos personales (teléfono, DNI), libreta de direcciones e historial de compras.
- **Reseñas** en la página de producto: promedio de estrellas, desglose y opiniones; solo pueden reseñar compradores con una orden `APPROVED`.
- **Preguntas y respuestas** por producto: los clientes preguntan y el admin responde públicamente.
- **Panel admin** `/admin`:
  - tabla con búsqueda, filtro y paginación,
  - CRUD de productos con variantes, galería de hasta 10 imágenes y subida de archivos múltiple,
  - toggle de destacados (máximo 3, validado en frontend y backend),
  - eliminación con confirmación modal,
  - solapa **Preguntas** (`/admin/questions`) para responder dudas pendientes.
- **Webhook** de Mercado Pago para actualizar el estado de las órdenes y restaurar stock si se rechaza.

---

## 🧰 Requisitos

- **Node.js** >= 22
- **npm** >= 10
- **MariaDB** o **MySQL** (base `icarodb`)

---

## ⚙️ Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd tp-final-icaro-caporaso-fullstack

# 2. Backend
cd backend
npm install
cp ../.env.template .env    # ajustar credenciales
npx prisma migrate dev
npm run db:seed

# 3. Frontend
cd ../frontend
npm install
# crear .env.local con NEXT_PUBLIC_API_URL y API_URL
```

> El seed crea el administrador usando `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME` de `backend/.env`. Si no están definidos, usa `admin@admin.com` / `admin` / `Administrador`.

---

## 🔐 Variables de entorno

### Backend — `backend/.env`

| Variable | Ejemplo | Descripción |
|---|---|---|
| `DATABASE_URL` | `mysql://root:root@localhost:3306/icarodb` | Conexión Prisma |
| `PORT` | `3030` | Puerto del backend |
| `CORS_ORIGIN` | `http://localhost:3000` | Origen permitido |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL del frontend (back_urls MP) |
| `BACKEND_PUBLIC_URL` | `http://localhost:3030` | URL pública del backend (webhook) |
| `JWT_SECRET` | `change_me` | Firma de tokens |
| `JWT_EXPIRES_IN` | `1d` | Expiración del token |
| `ADMIN_EMAIL` | `admin@admin.com` | Email del admin inicial (seed) |
| `ADMIN_PASSWORD` | `admin` | Contraseña del admin inicial (seed) |
| `ADMIN_NAME` | `Administrador` | Nombre del admin inicial (seed) |
| `MERCADOPAGO_ACCESS_TOKEN` | `TEST-...` | Token de Mercado Pago |
| `MERCADOPAGO_WEBHOOK_SECRET` | `change_me` | Firma del webhook (opcional) |
| `SMTP_HOST` | `smtp.gmail.com` | Servidor SMTP para verificación de cuentas |
| `SMTP_PORT` | `587` | Puerto SMTP (`465` usa TLS directo) |
| `SMTP_USER` | `tu@gmail.com` | Usuario/cuenta SMTP |
| `SMTP_PASS` | `app_password` | Contraseña o app password del proveedor |
| `MAIL_FROM` | `Patagonia Sports <no-reply@...>` | Remitente de los correos |

### Frontend — `frontend/.env.local`

| Variable | Ejemplo | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3030` | API usada por el navegador |
| `API_URL` | `http://localhost:3030` | API usada por Server Components |

> En producción, cambiá `JWT_SECRET`, usá credenciales reales de Mercado Pago y serví las imágenes desde un dominio público (o implementá el roadmap de Cloudinary/S3).

---

## 📧 Email y verificación de cuentas

Al registrarse, el backend genera un `verificationToken` y envía un correo con el enlace:

```
http://localhost:3000/verify-email?token=<token>
```

Configurá SMTP en `backend/.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu@gmail.com"
SMTP_PASS="tu_app_password"
MAIL_FROM="Patagonia Sports <no-reply@patagoniasports.com>"
```

Notas:

- Con Gmail u otros proveedores suele ser necesario generar una **app password** (no la contraseña normal).
- Si `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS` **no** están definidos, el backend:
  - imprime el enlace de verificación en la consola, y
  - lo devuelve como `devVerificationUrl`, que la pantalla de registro muestra como **“Modo desarrollo”** para poder probar el flujo sin servidor de correo.
- Los usuarios sin verificar **no pueden iniciar sesión** (el backend responde `403`).

### Checklist para probar el mail real

- [ ] Elegí un proveedor:
  - **Gmail:** `smtp.gmail.com`, puerto `587`, usuario tu Gmail y una **App Password** de 16 caracteres.
  - **Ethereal (pruebas):** creá una cuenta en [ethereal.email](https://ethereal.email), usá `smtp.ethereal.email` / `587` con el usuario y password que te genera; los correos se ven en su bandeja web (no se envían de verdad).
  - **Resend (SMTP):** `smtp.resend.com`, puerto `465`, usuario `resend` y tu API key como password; `MAIL_FROM` debe usar un dominio verificado.
- [ ] Completá `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM` en `backend/.env`.
- [ ] Reiniciá el backend (`npm run start:dev`).
- [ ] Registrá una cuenta nueva y confirmá que llega el correo.
- [ ] Abrí `/verify-email?token=...` y luego iniciá sesión.

---

## 🧭 Rutas del frontend

| Ruta | Descripción |
|---|---|
| `/` | Home con hero, categorías y destacados |
| `/productos` · `/productos/[id]` | Catálogo y detalle con variantes, reseñas y preguntas |
| `/cart` · `/checkout` | Carrito y checkout con Mercado Pago |
| `/account` | Login y registro (con pantalla de confirmación de correo) |
| `/verify-email?token=...` | Activa la cuenta desde el enlace del correo |
| `/profile` | **Mi perfil**: datos personales, libreta de direcciones y mis compras |
| `/admin` · `/admin/categories` · `/admin/banners` · `/admin/questions` | Panel de administración |

### `/profile`

- **Mis datos:** edición de teléfono y DNI (email de solo lectura).
- **Mis direcciones:** alta, edición, eliminación y selección de la dirección predeterminada para envío a domicilio.
- **Mis compras:** historial de pedidos con estado, ítems, variante, tipo de entrega y botón para dejar reseña en productos de órdenes `APPROVED`.

### `/verify-email`

- Lee el token del query string, llama a `GET /api/auth/verify-email?token=...`, muestra el resultado con Sonner y redirige al login.

---

## ⭐ Reseñas y preguntas

- **Reseñas** (`/api/products/:id/reviews`): promedio de 1 a 5 estrellas, desglose por puntaje y listado de opiniones. Para publicar una reseña se requiere una compra del producto con estado `APPROVED`; cada usuario puede reseñar una vez por producto.
- **Preguntas y respuestas** (`/api/products/:id/questions`): cualquier visitante puede leerlas; los usuarios autenticados pueden preguntar. Solo un `ADMIN` responde desde `/admin/questions` o `PATCH /api/questions/:id/answer`, y la respuesta se publica en la página del producto.

---

## ▶️ Desarrollo

```bash
# Terminal 1 — backend
cd backend
npm run start:dev      # http://localhost:3030/api

# Terminal 2 — frontend
cd frontend
npm run dev            # http://localhost:3000
```

### Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `ADMIN_EMAIL` (por defecto `admin@admin.com`) | `ADMIN_PASSWORD` (por defecto `admin`) |
| Cliente | `cliente@cliente.com` | `cliente` |

> El admin se crea desde `backend/.env` con `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME`. Volvé a correr `npm run db:seed` después de cambiarlos.

---

## 💳 Mercado Pago

1. Obtené un **Access Token de prueba** en el panel de desarrolladores de Mercado Pago.
2. Configuralo en `backend/.env`:

   ```env
   MERCADOPAGO_ACCESS_TOKEN="TEST-..."
   ```

3. Para probar el **webhook** en local, exponé el backend con un túnel:

   ```bash
   ngrok http 3030
   ```

   y actualizá:

   ```env
   BACKEND_PUBLIC_URL="https://<tu-subdominio>.ngrok-free.app"
   ```

4. El flujo es: crear orden → generar preferencia → redirigir a Checkout Pro → webhook actualiza el estado (`APPROVED` / `REJECTED` / `PENDING`).

### Checklist Sandbox

- [ ] Reemplazar el token de ejemplo (`TEST-000...`) por un **Access Token TEST real** de tu cuenta de Mercado Pago. Si queda el placeholder, el backend responde `400` con un mensaje explicativo.
- [ ] Con sesión de cliente, crear un pedido y llamar `POST /api/payments/preference` con `{ "orderId": <id> }`.
- [ ] Verificar que la respuesta incluya `preferenceId`, `initPoint` y `sandboxInitPoint`.
- [ ] Abrir `sandboxInitPoint` y pagar con una tarjeta de prueba (ej. Mastercard `5031 7557 3453 0604`, CVV `123`, vencimiento `11/25`, titular `APRO`).
- [ ] Exponer el backend con `ngrok` para que Mercado Pago pueda llamar al webhook y confirmar que la orden pasa a `APPROVED`.
- [ ] Verificar que el stock se descuente y que las reseñas del producto se habiliten para esa compra.

---

## 📜 Scripts

### Backend

| Script | Descripción |
|---|---|
| `npm run start:dev` | NestJS en modo watch |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta `dist/main` |
| `npm run prisma:generate` | Genera el cliente Prisma |
| `npm run prisma:migrate` | Crea/aplica migraciones |
| `npm run db:seed` | Ejecuta el seed |
| `npm run prisma:studio` | Abre Prisma Studio |

### Frontend

| Script | Descripción |
|---|---|
| `npm run dev` | Next.js en desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

---

## 🔌 API (resumen)

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/register` | público (no inicia sesión) |
| POST | `/api/auth/login` | público (bloquea cuentas no verificadas) |
| GET | `/api/auth/verify-email?token=` | público |
| POST | `/api/auth/logout` · GET `/api/auth/me` | auth |
| GET | `/api/products` · `/api/products/:id` | público |
| POST/PUT/DELETE | `/api/products` · `/api/products/:id` | ADMIN |
| GET | `/api/categories` | público |
| POST/PUT/DELETE | `/api/categories` | ADMIN |
| GET/PATCH | `/api/users/me` | auth |
| GET/POST | `/api/users/me/addresses` | auth |
| PATCH/DELETE | `/api/users/me/addresses/:id` | auth |
| GET | `/api/users/me/reviews` | auth |
| GET | `/api/users` | ADMIN |
| GET | `/api/products/:id/reviews` | público (incluye `canReview` si hay sesión) |
| POST | `/api/products/:id/reviews` | auth + orden `APPROVED` |
| GET | `/api/products/:id/questions` | público |
| POST | `/api/products/:id/questions` | auth |
| GET | `/api/questions?answered=` | ADMIN |
| PATCH | `/api/questions/:id/answer` | ADMIN |
| POST | `/api/reservations` | público (reserva stock por `sessionId`) |
| DELETE | `/api/reservations/:id` · `/api/reservations?sessionId=` | público |
| POST/GET | `/api/orders` | auth |
| POST | `/api/payments/preference` | auth |
| POST | `/api/payments/webhook` | público (MP) |

---

## 🗺️ Roadmap

Las próximas mejoras están detalladas en [`.opencode/ROADMAP.md`](.opencode/ROADMAP.md):

- **Deployment:** Dockerización (NestJS + Next.js + MariaDB) y almacenamiento de imágenes en Cloudinary/S3.
- **E-commerce:** wishlist, cupones, notificaciones de estado de orden y reseñas con moderación.
- **Admin & Analytics:** dashboard de métricas, exportación CSV/Excel y gestión de usuarios.

---

## 📄 Créditos

Proyecto final de la **Diplomatura Full Stack ICARO** — Manuel Caporaso.

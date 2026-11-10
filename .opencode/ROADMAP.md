# 🗺️ Roadmap — Patagonia Sports

Hoja de ruta de mejoras para futuras iteraciones.

**Estado actual:** MVP completo — catálogo con variantes, carrito con reservas temporales, checkout con Mercado Pago, autenticación JWT con verificación de email, perfil con libreta de direcciones, reseñas con estrellas, preguntas/respuestas y panel admin.

---

## 1. Architectural & Deployment

### 🐳 Dockerización

- [ ] `backend/Dockerfile` multi-stage (build + runtime Node 22 alpine).
- [ ] `frontend/Dockerfile` multi-stage (build + `next start`).
- [ ] `docker-compose.yml` con MariaDB, backend y frontend.
- [ ] Healthchecks, volúmenes persistentes y red interna.
- [ ] Variables de entorno por entorno (`.env.docker`).

### ☁️ Almacenamiento de imágenes en la nube

- [ ] Reemplazar `multer` local por **Cloudinary** o **AWS S3**.
- [ ] Servicio de storage en NestJS (interfaz + provider).
- [ ] URLs firmadas / CDN y optimización de imágenes.
- [ ] Migración de las imágenes actuales de `backend/assets/images`.

---

## 2. Funcionalidades de Usuario & E-commerce

### ⭐ Valoraciones y reseñas

- [x] Modelo `ProductReview` (`userId`, `productId`, `rating` 1-5, `comment`, `createdAt`).
- [x] Endpoints para crear y listar reseñas (`GET/POST /api/products/:id/reviews`).
- [x] Promedio de estrellas, desglose y listado en el detalle de producto.
- [x] Solo compradores con orden `APPROVED` pueden reseñar (una reseña por producto).
- [ ] Edición/eliminación de reseñas por el autor.
- [ ] Moderación desde el panel admin.

### ❤️ Lista de deseos (Wishlist)

- [ ] Modelo `Wishlist` persistente por usuario.
- [ ] Endpoint para agregar/quitar/listar.
- [ ] Botón de corazón en cards y página `/wishlist`.

### 📍 Direcciones múltiples

- [x] Modelo `Address` (calle, número, depto, ciudad, provincia, CP).
- [x] CRUD de direcciones en `/profile`.
- [x] Selección de dirección en checkout para `HOME_DELIVERY`.
- [x] Dirección predeterminada.

### 📧 Verificación de email

- [x] Campos `isEmailVerified` y `verificationToken` en `User`.
- [x] Integración de **Nodemailer** + enlace `/verify-email?token=...`.
- [x] Bloqueo de login para cuentas no verificadas.
- [x] Fallback de desarrollo (enlace en consola y en la pantalla de registro).
- [ ] Reenvío de verificación y expiración de tokens.

### 💬 Preguntas y respuestas

- [x] Modelo `ProductQuestion` (pregunta, respuesta, `answeredAt`).
- [x] Preguntas públicas por producto + formulario para clientes autenticados.
- [x] Respuesta oficial solo para `ADMIN`.
- [x] Solapa de gestión en `/admin/questions` con filtros pendientes/respondidas.

### 📨 Notificaciones por mail

- [x] Integrar **Nodemailer** (usado para verificación de cuentas).
- [ ] Templates para orden `APPROVED`, `REJECTED` y `DESPACHADO`.
- [ ] Cola de envío / reintentos.
- [ ] Preferencias de notificación por usuario.

---

## 3. Admin & Analytics

### 📊 Dashboard de métricas

- [ ] Ingresos mensuales y comparación período anterior.
- [ ] Productos más vendidos.
- [ ] Gráfico de órdenes por estado / tiempo (Recharts o Tremor).
- [ ] KPIs: ticket promedio, conversión, stock crítico.

### 📤 Exportación de reportes

- [ ] Exportar ventas a CSV / Excel.
- [ ] Exportar stock actual y movimientos.
- [ ] Filtros por rango de fechas y estado.

### 🎟️ Cupones y promociones

- [ ] Modelo `Coupon` (código, tipo, valor, vigencia, usos).
- [ ] Validación en checkout y cálculo de descuento.
- [ ] Panel admin para crear/desactivar cupones.
- [ ] Promociones por categoría o producto.

---

## 4. Mejoras técnicas (bonus)

- [ ] Tests e2e (Jest + Supertest en backend, Playwright en frontend).
- [ ] CI/CD con GitHub Actions (lint + build + tests).
- [ ] Swagger / OpenAPI en NestJS.
- [ ] Rate limiting + Helmet.
- [ ] Logging estructurado y monitoreo (Sentry).
- [ ] Internacionalización (es/en).
- [ ] Optimización SEO y de imágenes.
- [ ] Accesibilidad (a11y) y auditoría Lighthouse.

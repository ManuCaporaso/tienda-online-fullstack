# Project Memory & Architecture Log

## Stack Overview

- **Backend:** NestJS 10 + Prisma 6 + MariaDB (`icarodb`) — puerto **3030**
- **Frontend:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 — puerto **3000**
- **Auth:** JWT en cookie httpOnly + Passport + `proxy.ts` (Next 16)
- **Email:** Nodemailer (verificación de cuentas)
- **Payments:** Mercado Pago SDK (Preference + Webhook)
- **UI:** lucide-react + sonner + sweetalert2

## Database Schema (Prisma)

- `User`: id, email, password, role (`ADMIN` | `CLIENT`), `isEmailVerified`, `verificationToken`, `phone`, `documentNumber`, createdAt, updatedAt
- `Category`: id, name, description
- `Product`: id, name, description, price, stock, imageUrl, highlighted, categoryId, specs
- `ProductVariant`: id, name, value, stock, price?, productId
- `CartReservation`: id, sessionId, productId, variantId?, quantity, expiresAt (TTL 10 min)
- `Order`: id, userId, total, status (`PENDING` | `APPROVED` | `IN_PREPARATION` | `READY_FOR_PICKUP` | `SHIPPED` | `DELIVERED` | `CANCELLED`), deliveryType (`SHIPPING` | `PICKUP`), `shippingAddress` (snapshot JSON), `trackingNumber`, `paymentMethod`, mpPreferenceId, mpPaymentId
- `OrderItem`: id, orderId, productId, quantity, price, `variantId`, `variantLabel`
- `Address`: id, userId, street, number, apartment?, city, state, zipCode, isDefault
- `ProductReview`: id, productId, userId, rating (1–5), comment, createdAt — único por `[productId, userId]`
- `ProductQuestion`: id, productId, userId, question, answer?, answeredAt?, createdAt

## Frontend Routes

- `/` — home (hero + categorías + destacados)
- `/productos` — catálogo con filtros (RSC + Suspense)
- `/productos/[id]` — detalle con variantes, reseñas y preguntas
- `/cart` — carrito completo con timer de reservas
- `/checkout` — checkout + dirección predeterminada + Mercado Pago
- `/checkout/success|failure|pending` — resultados del pago
- `/account` — login / registro (pantalla “revisá tu correo”)
- `/verify-email?token=` — activación de cuenta
- `/profile` — datos personales, direcciones e historial de compras
- `/dashboard` — redirige a `/profile`
- `/admin` — productos (CRUD, variantes, destacados)
- `/admin/orders` — gestión de ventas: estados, entrega y seguimiento
- `/admin/categories` — categorías
- `/admin/banners` — banners
- `/admin/questions` — responder preguntas de clientes

## Backend Endpoints (resumen)

- **Auth:** `POST /api/auth/register|login|logout`, `GET /api/auth/verify-email`, `GET /api/auth/me`
- **Users:** `GET/PATCH /api/users/me`, CRUD `/api/users/me/addresses`, `GET /api/users/me/reviews`, `GET /api/users` (ADMIN)
- **Products:** `GET /api/products`, `GET /api/products/:id`, `POST/PUT/DELETE` (ADMIN)
- **Categories:** `GET` público, `POST/PUT/DELETE` (ADMIN)
- **Reviews:** `GET /api/products/:id/reviews` (público), `POST` (auth + orden `APPROVED`)
- **Questions:** `GET/POST /api/products/:id/questions`, `GET /api/questions` y `PATCH /api/questions/:id/answer` (ADMIN)
- **Reservations:** `POST/GET/DELETE /api/reservations` (stock temporal por `sessionId`)
- **Orders:** `POST/GET /api/orders` (auth), `GET /api/orders/admin` y `PATCH /api/orders/admin/:id/status` (ADMIN)
- **Payments:** `POST /api/payments/preference` (auth), `POST /api/payments/webhook` (MP)

## Decisiones de arquitectura

- Prisma 6 (Prisma 7 introducía breaking changes en el generador).
- `prisma db push` en entornos no interactivos; `migrate dev` falla sin TTY.
- JWT en cookie httpOnly + protección de rutas con `proxy.ts`.
- Máximo **3 productos destacados**, validado en frontend y backend.
- Stock por variante: `product.stock` = suma de `ProductVariant.stock`.
- Galería de hasta 10 imágenes por producto: la primera subida es la principal (`Product.imageUrl`) y el resto se guarda en `ProductImage`.
- Seed del admin parametrizado por `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME` (fallback: `admin@admin.com` / `admin` / `Administrador`).
- El endpoint de preferencias de Mercado Pago detecta el token placeholder y responde `400` con instrucciones para configurar un token TEST real.
- Reservas de carrito con TTL de 10 minutos y `sessionId` en `localStorage`.
- `crypto.randomUUID` con fallback (`generateUUID`) para IPs locales sin HTTPS.
- Las cards con variantes redirigen a “Ver opciones”; con una sola variante se autoselecciona.
- Verificación de email obligatoria antes del login; sin SMTP el enlace se loguea y se expone como `devVerificationUrl`.
- Las reseñas requieren una orden `APPROVED` del producto (webhook de Mercado Pago).
- Imágenes locales en `backend/assets/images` (roadmap: Cloudinary/S3).
- `ValidationPipe` sin `enableImplicitConversion` para respetar booleanos de `FormData`.
- El carrito se limpia **solo** en `/checkout/success`, después de consultar `GET /api/orders/:id` y confirmar que la orden quedó `APPROVED`. Las reservas de 10 minutos sobreviven al redirect de Mercado Pago y solo se liberan en ese punto (o al expirar).

## Credenciales de prueba

- Admin: `admin@admin.com` / `admin`
- Cliente: `cliente@cliente.com` / `cliente`

## Legacy

- `tp-backend` y `tp-frontend` eliminados. El dump SQL original queda en el historial de git.

## Progress Checklist

- [x] Setup NestJS backend with Prisma ORM
- [x] Seed database mapped to legacy `icarodb`
- [x] Create NestJS Auth module (JWT) & Guards
- [x] Build Products, Orders, and Mercado Pago Modules in NestJS
- [x] Setup Next.js Frontend with Tailwind, Lucide React, and Sonner
- [x] Implement Cart context with local state & Toast feedback
- [x] Integrate Mercado Pago Checkout Pro flow in Frontend
- [x] Admin panel with full product CRUD, image upload & highlight toggle
- [x] Variant-level stock management + admin variant editor
- [x] 10-minute temporary stock reservations + countdown timer
- [x] Email verification flow (Nodemailer + `/verify-email`)
- [x] User profile: personal data, address book, purchase history
- [x] Product reviews with star ratings (verified buyers only)
- [x] Product questions & admin answers panel
- [x] Multi-image product gallery upload (up to 10, first = main)
- [x] Parametrized admin seed from `ADMIN_*` env vars
- [x] Sales management: order statuses, shipping tracking and `/admin/orders`

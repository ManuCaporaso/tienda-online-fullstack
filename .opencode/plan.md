# Plan de Migración — Legacy a Arquitectura Moderna

## Stack objetivo

- **Backend:** NestJS + Prisma ORM + JWT (Passport) + Mercado Pago SDK — puerto **3030**
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + `lucide-react` + `sonner` / `sweetalert2` — puerto **3000**
- **DB:** MariaDB/MySQL `icarodb`

## Decisiones acordadas

1. **Schema nuevo + seed**: schema Prisma limpio (`User`, `Product`, `Category`, `Order`, `OrderItem`) con `prisma migrate` sobre `icarodb` y seed con datos legacy (8 categorías + productos con imágenes).
2. **JWT en cookie httpOnly** + middleware de Next.js para proteger `/admin` y `/checkout`.
3. **Mercado Pago completo**: `POST /api/payments/preference` + `POST /api/payments/webhook`.

Los directorios legacy `tp-backend` y `tp-frontend` quedan intactos como referencia.

---

## FASE 1 — Backend NestJS + Prisma (`/backend`, :3030)

### Schema Prisma

```prisma
enum Role { ADMIN CLIENT }
enum OrderStatus { PENDING APPROVED REJECTED }
enum DeliveryType { HOME_DELIVERY PICKUP }

model User      { id, email @unique, password, role, createdAt, updatedAt, orders Order[] }
model Product   { id, name, description?, price, stock, imageUrl?, highlighted, categoryId, category, orderItems, createdAt, updatedAt }
model Category  { id, name @unique, description?, products Product[] }
model Order     { id, userId, user, total, status, deliveryType, mpPreferenceId?, mpPaymentId?, items OrderItem[], createdAt, updatedAt }
model OrderItem { id, orderId, order, productId, product, quantity, price }
```

> Se conserva `Category` (no estaba en MEMORY.md) porque el catálogo legacy depende de él. `highlighted` se mantiene para el "máx. 3 destacados".

### Módulos

`Prisma` (global), `Auth`, `Users`, `Products`, `Categories`, `Orders`, `Payments`.

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/register` | público |
| POST | `/api/auth/login` (setea cookie httpOnly) | público |
| POST | `/api/auth/logout` | auth |
| GET | `/api/auth/me` | auth |
| GET | `/api/products`, `/api/products/:id` | público |
| POST/PUT/DELETE | `/api/products`, `/api/products/:id` | `@Roles('ADMIN')` |
| GET/POST | `/api/categories` | público / admin |
| POST | `/api/orders` (crea Order + OrderItems) | auth |
| GET | `/api/orders` (historial) | auth |
| POST | `/api/payments/preference` | auth |
| POST | `/api/payments/webhook` | público (MP) |

### Cross-cutting

- `ValidationPipe` global + `class-validator` / `class-transformer`
- `JwtAuthGuard`, `RolesGuard`, `@Roles('ADMIN')`, `@CurrentUser()`
- Passport JWT leyendo la cookie
- CORS con `credentials: true` y `origin` del frontend
- Servir imágenes estáticas (`/assets/images`) reutilizando las imágenes legacy
- `prisma seed` (admin `admin@admin.com` / `admin`)

---

## FASE 2 — Frontend Next.js (`/frontend`, :3000)

- App Router + TypeScript + Tailwind CSS + `lucide-react` + `sonner` + `sweetalert2`
- `proxy.ts` (Next.js 16 reemplaza `middleware.ts`): protege `/admin` (solo ADMIN), `/checkout` y `/dashboard` (requieren sesión) leyendo la cookie JWT
- `layout.tsx`: Navbar responsivo + resumen de carrito (Client) + `<Toaster />`
- `lib/`: cliente API (`credentials: 'include'`), contexto de carrito, helpers auth

---

## FASE 3 — Catálogo y carrito

- `/` catálogo con **Server Component** (fetch a NestJS), filtros por categoría / precio / búsqueda
- Carrito **Client Component** (context + `localStorage`)
- Toggle "Envío a domicilio" / "Retiro en sucursal"
- Agregar producto → toast `sonner`; stock insuficiente → alerta; confirmar compra → `sweetalert2` + redirección al `init_point` de Checkout Pro

---

## FASE 4 — Panel admin `/admin`

- Protegido por middleware + verificación de rol
- Tabla CRUD de productos (crear / editar / eliminar), subida de imagen, toggle "destacado" (máx. 3)
- Feedback visual con toast / modal

---

## Progreso

- [x] Fase 1: scaffold NestJS + Prisma + schema + seed
- [x] Fase 1: módulos Auth / Users / Products / Categories / Orders / Payments + guards
- [x] Fase 2: scaffold Next.js + Tailwind + UI base
- [x] Fase 3: catálogo, carrito y checkout MP
- [x] Fase 4: panel admin CRUD

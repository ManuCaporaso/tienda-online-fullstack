# OpenCode System Prompt & Rules

## Core Architecture
- **Backend:** NestJS + Prisma ORM + MySQL/MariaDB (`icarodb`)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **UI Components & Feedback:** Lucide Icons (`lucide-react`) + Toast Alerts (`sonner` o `sweetalert2`)
- **Payments:** Mercado Pago Node.js SDK (Backend) + Checkout Pro (Frontend)
- **Auth:** JWT Passport strategy in NestJS + Middleware protection in Next.js

## Backend Directives (NestJS + Prisma)
1. Use modular structure: `AuthModule`, `UsersModule`, `ProductsModule`, `OrdersModule`, `PaymentsModule`.
2. Implement Global Pipes (`ValidationPipe` with `class-validator` / `class-transformer`).
3. Protect admin routes using `@UseGuards(JwtAuthGuard, RolesGuard)` and custom decorator `@Roles('ADMIN')`.
4. Payment Webhooks: Route listener in `PaymentsController` (`POST /api/payments/webhook`) to update order status via Prisma.

## Frontend Directives (Next.js App Router)
1. Use React Server Components (RSC) for product catalog listing.
2. Use Client Components (`"use client"`) for interactive features (Cart state, checkout selection, admin panels).
3. Lucide Icons for all UI elements (cart, user, admin controls, delivery/pickup icons).
4. Rich interactive notifications via `sonner` (toasts) or `sweetalert2` for order confirmations, errors, and cart actions.
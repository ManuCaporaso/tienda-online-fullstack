export type Role = "ADMIN" | "CLIENT";
export type DeliveryType = "SHIPPING" | "PICKUP";
export type OrderStatus =
  | "PENDING"
  | "APPROVED"
  | "IN_PREPARATION"
  | "READY_FOR_PICKUP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface User {
  id: number;
  email: string;
  name?: string | null;
  role: Role;
  isEmailVerified?: boolean;
  phone?: string | null;
  documentNumber?: string | null;
  createdAt?: string;
}

export interface Address {
  id: string;
  userId: number;
  street: string;
  number: string;
  apartment?: string | null;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingAddress {
  street: string;
  number: string;
  apartment?: string | null;
  city: string;
  state: string;
  zipCode: string;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userId: number;
  userName: string;
}

export interface ReviewsSummary {
  average: number;
  total: number;
  distribution: { stars: number; count: number }[];
  canReview: boolean;
  myReview: ProductReview | null;
  reviews: ProductReview[];
}

export interface ProductQuestion {
  id: string;
  question: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  userId: number;
  userName: string;
}

export interface AdminQuestion extends ProductQuestion {
  product: { id: string; name: string; imageUrl?: string | null };
  user?: { id: number; email: string };
}

export interface MyReview {
  id: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  url: string;
  productId: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  stock: number;
  price?: number | string | null;
  productId: string;
  availableStock?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  imageUrl?: string | null;
  highlighted: boolean;
  categoryId: string;
  category?: { id: string; name: string } | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  specs?: Record<string, unknown> | null;
  availableStock?: number;
}

export interface CartItem extends Product {
  quantity: number;
  variantLabel?: string;
  variantId?: string;
  lineId: string;
  reservationId?: string;
  reservationExpiresAt?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: string;
  quantity: number;
  price: number;
  variantId?: string | null;
  variantLabel?: string | null;
  product: Product;
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: OrderStatus;
  deliveryType: DeliveryType;
  shippingAddress?: ShippingAddress | null;
  trackingNumber?: string | null;
  paymentMethod?: string | null;
  mpPreferenceId?: string | null;
  mpPaymentId?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: number;
    email: string;
    name?: string | null;
    phone?: string | null;
    documentNumber?: string | null;
  };
  items: OrderItem[];
}

export interface Banner {
  id: string;
  title?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

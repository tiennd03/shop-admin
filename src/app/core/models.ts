export type ProductStatus = 'active' | 'inactive';

export const PRODUCT_CATEGORIES = ['Apparel', 'Footwear', 'Accessories', 'Electronics'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  stock: number;
  status: ProductStatus;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Fields the user can edit in the product form. */
export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export const LOW_STOCK_THRESHOLD = 10;

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'completed',
  'cancelled',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

/** Lowercase and strip accents so "ao" matches "Áo" and "cafe" matches "Café". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

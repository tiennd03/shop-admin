import { Injectable, inject } from '@angular/core';
import { Timestamp, collection, doc, writeBatch } from 'firebase/firestore';
import { FIRESTORE } from './firebase';
import { OrderItem, OrderStatus, ProductCategory, ProductInput } from './models';

const SAMPLE_PRODUCTS: Array<Pick<ProductInput, 'name' | 'category' | 'price'>> = [
  { name: 'Classic Cotton T-Shirt', category: 'Apparel', price: 19.9 },
  { name: 'Slim Fit Denim Jeans', category: 'Apparel', price: 49 },
  { name: 'Hooded Zip Sweatshirt', category: 'Apparel', price: 39.5 },
  { name: 'Linen Button-Down Shirt', category: 'Apparel', price: 34 },
  { name: 'Everyday Running Sneakers', category: 'Footwear', price: 79 },
  { name: 'Leather Chelsea Boots', category: 'Footwear', price: 129 },
  { name: 'Canvas Slip-Ons', category: 'Footwear', price: 29.9 },
  { name: 'Minimal Leather Wallet', category: 'Accessories', price: 24 },
  { name: 'Waterproof Backpack 20L', category: 'Accessories', price: 59 },
  { name: 'Stainless Steel Water Bottle', category: 'Accessories', price: 18.5 },
  { name: 'Wireless Earbuds', category: 'Electronics', price: 69 },
  { name: 'Fast Charging Power Bank', category: 'Electronics', price: 35 },
];

const CUSTOMERS = [
  'Nguyen Van An', 'Tran Thi Binh', 'Le Minh Chau', 'Pham Quoc Dung', 'Hoang Gia Huy',
  'Emily Carter', 'James Walker', 'Sofia Rossi', 'Kenji Tanaka', 'Mai Linh',
];

const STATUS_WEIGHTS: Array<[OrderStatus, number]> = [
  ['completed', 0.45],
  ['shipped', 0.18],
  ['processing', 0.15],
  ['pending', 0.14],
  ['cancelled', 0.08],
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(items: readonly T[]): T => items[randomInt(0, items.length - 1)];
const round2 = (n: number) => Math.round(n * 100) / 100;

function weightedStatus(): OrderStatus {
  let r = Math.random();
  for (const [status, weight] of STATUS_WEIGHTS) {
    if ((r -= weight) <= 0) return status;
  }
  return 'completed';
}

function skuFor(name: string, category: ProductCategory, index: number): string {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return `${category.slice(0, 3).toUpperCase()}-${initials}-${String(index + 1).padStart(3, '0')}`;
}

/** Fills Firestore with demo products and ~40 orders from the last 14 days. */
@Injectable({ providedIn: 'root' })
export class SeedService {
  private readonly db = inject(FIRESTORE);

  async seed(): Promise<void> {
    const batch = writeBatch(this.db);
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const products = SAMPLE_PRODUCTS.map((p, i) => {
      const ref = doc(collection(this.db, 'products'));
      const createdAt = Timestamp.fromMillis(now - (30 - i) * day);
      const data: ProductInput = {
        ...p,
        sku: skuFor(p.name, p.category, i),
        // A few items start low on stock so the dashboard warning has something to show
        stock: i % 5 === 0 ? randomInt(2, 8) : randomInt(15, 120),
        status: i === SAMPLE_PRODUCTS.length - 1 ? 'inactive' : 'active',
        description: '',
      };
      batch.set(ref, { ...data, createdAt, updatedAt: createdAt });
      return { id: ref.id, ...data };
    });

    for (let i = 0; i < 40; i++) {
      const items: OrderItem[] = [];
      const count = randomInt(1, 3);
      for (let j = 0; j < count; j++) {
        const product = pick(products);
        if (items.some((it) => it.productId === product.id)) continue;
        items.push({ productId: product.id, name: product.name, price: product.price, quantity: randomInt(1, 3) });
      }
      const total = round2(items.reduce((sum, it) => sum + it.price * it.quantity, 0));
      const customerName = pick(CUSTOMERS);
      const createdAt = Timestamp.fromMillis(now - randomInt(0, 13) * day - randomInt(0, 20) * 60 * 60 * 1000);

      batch.set(doc(collection(this.db, 'orders')), {
        code: `ORD-${String(1001 + i)}`,
        customerName,
        customerEmail: `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        items,
        total,
        status: weightedStatus(),
        createdAt,
      });
    }

    await batch.commit();
  }
}

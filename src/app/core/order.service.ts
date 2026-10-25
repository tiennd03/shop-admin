import { Injectable, inject } from '@angular/core';
import { collection, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { shareReplay } from 'rxjs';
import { FIRESTORE, collectionChanges } from './firebase';
import { Order, OrderStatus } from './models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly db = inject(FIRESTORE);

  /** Realtime list of orders, newest first. */
  readonly orders$ = collectionChanges<Order>(
    query(collection(this.db, 'orders'), orderBy('createdAt', 'desc')),
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  updateStatus(id: string, status: OrderStatus) {
    return updateDoc(doc(this.db, 'orders', id), { status });
  }
}

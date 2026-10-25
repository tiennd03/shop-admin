import { Injectable, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { shareReplay } from 'rxjs';
import { FIRESTORE, collectionChanges } from './firebase';
import { Product, ProductInput } from './models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly db = inject(FIRESTORE);
  private readonly col = collection(this.db, 'products');

  /** Realtime list of products, newest first. Shared so several components reuse one listener. */
  readonly products$ = collectionChanges<Product>(query(this.col, orderBy('createdAt', 'desc'))).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  create(input: ProductInput) {
    return addDoc(this.col, {
      ...input,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  update(id: string, input: ProductInput) {
    return updateDoc(doc(this.db, 'products', id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  }

  remove(id: string) {
    return deleteDoc(doc(this.db, 'products', id));
  }
}

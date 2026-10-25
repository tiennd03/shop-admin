import { InjectionToken, Provider } from '@angular/core';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import {
  DocumentData,
  Firestore,
  Query,
  Timestamp,
  getFirestore,
  onSnapshot,
} from 'firebase/firestore';
import { Observable } from 'rxjs';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH');
export const FIRESTORE = new InjectionToken<Firestore>('FIRESTORE');

/**
 * Registers the Firebase SDK with Angular DI.
 * Uses the official modular SDK directly (no wrapper library), so it works with any Angular version.
 */
export function provideFirebase(options: FirebaseOptions): Provider[] {
  return [
    { provide: FIREBASE_APP, useFactory: () => initializeApp(options) },
    { provide: FIREBASE_AUTH, useFactory: (app: FirebaseApp) => getAuth(app), deps: [FIREBASE_APP] },
    { provide: FIRESTORE, useFactory: (app: FirebaseApp) => getFirestore(app), deps: [FIREBASE_APP] },
  ];
}

/** Converts Firestore Timestamps in a document to JS Dates (one level deep). */
function toPlain(data: DocumentData): DocumentData {
  const out: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = value instanceof Timestamp ? value.toDate() : value;
  }
  return out;
}

/** Realtime stream of a Firestore query, mapped to plain objects with their document id. */
export function collectionChanges<T>(q: Query): Observable<T[]> {
  return new Observable<T[]>((subscriber) =>
    onSnapshot(
      q,
      // serverTimestamps: 'estimate' avoids null dates while a write is still pending
      (snapshot) =>
        subscriber.next(
          snapshot.docs.map(
            (d) => ({ id: d.id, ...toPlain(d.data({ serverTimestamps: 'estimate' })) }) as T,
          ),
        ),
      (error) => subscriber.error(error),
    ),
  );
}

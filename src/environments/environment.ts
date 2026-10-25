// Firebase web config — get it from:
// Firebase console → Project settings → General → Your apps → Web app → SDK setup and configuration.
// These values identify your project; they are not secrets. Data is protected by firestore.rules.
export const environment = {
  firebase: {
    apiKey: 'AIzaSyDx5VBjLzTs0j2fxkCs9RtaaODlhvcZxro',
    authDomain: 'my-repo-0511.firebaseapp.com',
    projectId: 'my-repo-0511',
    storageBucket: 'my-repo-0511.firebasestorage.app',
    messagingSenderId: '599068356718',
    appId: '1:599068356718:web:31a06839edfbe1f230b67f',
  },
};

export const isFirebaseConfigured =
  !environment.firebase.apiKey.startsWith('YOUR_');

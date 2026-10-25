# Shop Admin

An admin dashboard for a small online store, built with **Angular 20**, **Angular Material** and **Firebase**.
Store staff can sign in, manage the product catalog, track orders and see sales at a glance — all data updates in realtime.

> **Live demo:** _add your deployed URL here_ · Demo account: _add a test email/password here_

<!-- Add screenshots: docs/screenshots/dashboard.png, products.png, orders.png -->

## Features

- **Authentication** — email/password sign-in and sign-up with Firebase Auth; route guards protect the admin area and restore the session on reload.
- **Dashboard** — KPI cards (revenue, orders, average order value, pending), a 14-day revenue bar chart, an orders-by-status doughnut, recent orders and low-stock alerts.
- **Products** — full CRUD in a dialog form with validation, search (accent-insensitive) by name or SKU, category filter, sorting and pagination.
- **Orders** — status filter chips with counts, search, inline status updates, and an order detail dialog.
- **Realtime data** — Firestore snapshot listeners keep every screen in sync across tabs and users.
- **Responsive** — collapsible side navigation on mobile, tables scroll horizontally on small screens.
- **One-click sample data** — seed products and 40 orders to try the app instantly.
- **Security rules** — Firestore rules validate product fields and only allow an order's status to change.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Angular 20 — standalone components, signals (`signal`, `computed`, `effect`, `toSignal`), new control flow (`@if`, `@for`), functional guards, lazy-loaded routes |
| UI | Angular Material 3 (table, sort, paginator, dialog, chips, sidenav), SCSS with Material design tokens |
| Forms | Typed reactive forms with `NonNullableFormBuilder` |
| State & data | RxJS + signals; Firebase JS SDK v12 (Auth, Firestore) wrapped in Angular DI tokens |
| Charts | Chart.js via a small reusable wrapper component |
| CI | GitHub Actions builds every push |

## Project structure

```
src/app
├── core/                 # Firebase setup, models, services, guards
│   ├── firebase.ts       # DI tokens + realtime query → Observable helper
│   ├── auth.service.ts   # Signal-based auth state
│   ├── auth.guard.ts     # authGuard / guestGuard
│   ├── product.service.ts
│   ├── order.service.ts
│   └── seed.service.ts   # Demo data generator
├── layout/               # App shell: sidenav + toolbar
├── shared/               # Chart wrapper, confirm dialog
└── features/             # Lazy-loaded pages
    ├── login/
    ├── dashboard/
    ├── products/
    └── orders/
```

## Getting started

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create a project.
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Firestore Database →** create a database (production mode is fine — rules are below).
4. **Project settings → Your apps →** add a **Web app** and copy its config.

### 2. Configure and run

```bash
npm install
```

Paste your config into `src/environments/environment.ts`, then:

```bash
npm start
```

Open http://localhost:4200, create an account, and click **Generate sample data** on the dashboard.

### 3. Deploy rules and hosting (optional)

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # pick your project
firebase deploy --only firestore:rules
npm run build
firebase deploy --only hosting
```

## Roadmap

- Role-based access (admin vs. staff) using Firebase custom claims
- Create orders from the admin panel
- Product images with Firebase Storage
- Dark mode and i18n (English / Vietnamese)
- Unit tests for services and components

## License

MIT

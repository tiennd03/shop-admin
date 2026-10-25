import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { catchError, of } from 'rxjs';
import {
  LOW_STOCK_THRESHOLD,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  Order,
  Product,
} from '../../core/models';
import { OrderService } from '../../core/order.service';
import { ProductService } from '../../core/product.service';
import { SeedService } from '../../core/seed.service';
import { ChartComponent } from '../../shared/chart.component';

const DAYS = 14;

/** Reads a CSS custom property so charts follow the theme. */
function cssVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    ChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly seedService = inject(SeedService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly labels = ORDER_STATUS_LABELS;
  protected readonly lowStockThreshold = LOW_STOCK_THRESHOLD;
  protected readonly loadError = signal<string | null>(null);
  protected readonly seeding = signal(false);

  private readonly products = toSignal(
    inject(ProductService).products$.pipe(catchError((err) => this.handleError(err, [] as Product[]))),
    { initialValue: null },
  );
  private readonly orders = toSignal(
    inject(OrderService).orders$.pipe(catchError((err) => this.handleError(err, [] as Order[]))),
    { initialValue: null },
  );

  protected readonly loading = computed(() => this.products() === null || this.orders() === null);
  protected readonly isEmpty = computed(
    () => !this.loading() && this.products()!.length === 0 && this.orders()!.length === 0,
  );

  /** Orders that count towards revenue (everything except cancelled). */
  private readonly billableOrders = computed(() =>
    (this.orders() ?? []).filter((o) => o.status !== 'cancelled'),
  );

  protected readonly stats = computed(() => {
    const billable = this.billableOrders();
    const revenue = billable.reduce((sum, o) => sum + o.total, 0);
    return {
      revenue,
      orders: (this.orders() ?? []).length,
      avgOrder: billable.length ? revenue / billable.length : 0,
      pending: (this.orders() ?? []).filter((o) => o.status === 'pending').length,
    };
  });

  protected readonly lowStockProducts = computed(() =>
    (this.products() ?? [])
      .filter((p) => p.status === 'active' && p.stock < LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5),
  );

  protected readonly recentOrders = computed(() => (this.orders() ?? []).slice(0, 6));

  protected readonly revenueChart = computed<ChartConfiguration<'bar', number[], string>>(() => {
    const today = startOfDay(new Date());
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Array.from({ length: DAYS }, (_, i) => today - (DAYS - 1 - i) * dayMs);
    const totals = new Map<number, number>(days.map((d) => [d, 0]));

    for (const order of this.billableOrders()) {
      const key = startOfDay(order.createdAt);
      if (totals.has(key)) totals.set(key, totals.get(key)! + order.total);
    }

    const formatDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const formatMoney = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    });
    const primary = cssVar('--mat-sys-primary', '#2f5fd0');
    const grid = cssVar('--mat-sys-outline-variant', '#e0e0e0');

    return {
      type: 'bar',
      data: {
        labels: days.map((d) => formatDay.format(d)),
        datasets: [
          {
            label: 'Revenue',
            data: days.map((d) => Math.round(totals.get(d)! * 100) / 100),
            backgroundColor: primary,
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${formatMoney.format(ctx.parsed.y ?? 0)}` } },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: grid },
            border: { display: false },
            ticks: { callback: (value) => formatMoney.format(Number(value)) },
          },
        },
      },
    };
  });

  protected readonly statusChart = computed<ChartConfiguration<'doughnut', number[], string>>(() => {
    const orders = this.orders() ?? [];
    const counts = ORDER_STATUSES.map((s) => orders.filter((o) => o.status === s).length);
    return {
      type: 'doughnut',
      data: {
        labels: ORDER_STATUSES.map((s) => ORDER_STATUS_LABELS[s]),
        datasets: [
          {
            data: counts,
            backgroundColor: ORDER_STATUSES.map((s) => cssVar(`--status-${s}`, '#888')),
            borderColor: cssVar('--mat-sys-surface', '#fff'),
            borderWidth: 2,
          },
        ],
      },
      options: {
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 14 } },
        },
      },
    };
  });

  protected async seed(): Promise<void> {
    this.seeding.set(true);
    try {
      await this.seedService.seed();
      this.snackBar.open('Sample products and orders created');
    } catch (err) {
      console.error(err);
      this.snackBar.open('Could not create sample data. Check your Firestore rules.', 'Close');
    } finally {
      this.seeding.set(false);
    }
  }

  private handleError<T>(err: unknown, fallback: T) {
    console.error(err);
    this.loadError.set('Could not load data. Check your Firestore rules and connection.');
    return of(fallback);
  }
}

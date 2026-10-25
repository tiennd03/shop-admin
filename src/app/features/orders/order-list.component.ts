import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  Order,
  OrderStatus,
  normalizeText,
} from '../../core/models';
import { OrderService } from '../../core/order.service';
import { OrderDetailDialogComponent } from './order-detail-dialog.component';

type StatusFilter = OrderStatus | 'all';

@Component({
  selector: 'app-order-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent {
  private readonly orderService = inject(OrderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly statuses = ORDER_STATUSES;
  protected readonly labels = ORDER_STATUS_LABELS;
  protected readonly columns = ['code', 'customer', 'createdAt', 'items', 'total', 'status'];

  protected readonly search = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly loadError = signal<string | null>(null);

  private readonly orders = toSignal(
    this.orderService.orders$.pipe(
      catchError((err) => {
        console.error(err);
        this.loadError.set('Could not load orders. Check your Firestore rules and connection.');
        return of([] as Order[]);
      }),
    ),
    { initialValue: null },
  );

  protected readonly loading = computed(() => this.orders() === null);

  /** Order count per status, for the filter chips. */
  protected readonly counts = computed(() => {
    const counts: Record<StatusFilter, number> = {
      all: 0, pending: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0,
    };
    for (const order of this.orders() ?? []) {
      counts.all++;
      counts[order.status]++;
    }
    return counts;
  });

  protected readonly filtered = computed(() => {
    const query = normalizeText(this.search());
    const status = this.statusFilter();
    return (this.orders() ?? []).filter(
      (o) =>
        (status === 'all' || o.status === status) &&
        (!query ||
          normalizeText(o.code).includes(query) ||
          normalizeText(o.customerName).includes(query) ||
          normalizeText(o.customerEmail).includes(query)),
    );
  });

  protected readonly dataSource = new MatTableDataSource<Order>([]);
  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    // Sort by the column's underlying value ("customer" column sorts by name)
    this.dataSource.sortingDataAccessor = (order, column) => {
      switch (column) {
        case 'customer':
          return order.customerName;
        case 'createdAt':
          return order.createdAt.getTime();
        case 'items':
          return order.items.length;
        case 'total':
          return order.total;
        case 'status':
          return ORDER_STATUSES.indexOf(order.status);
        default:
          return order.code;
      }
    };

    effect(() => {
      this.dataSource.data = this.filtered();
    });
    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });
  }

  protected setStatusFilter(value: StatusFilter | null | undefined): void {
    this.statusFilter.set(value ?? 'all');
  }

  protected itemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  protected openDetail(order: Order): void {
    this.dialog.open(OrderDetailDialogComponent, { data: order, width: '560px', maxWidth: '95vw' });
  }

  protected async changeStatus(order: Order, status: OrderStatus): Promise<void> {
    if (status === order.status) return;
    try {
      await this.orderService.updateStatus(order.id, status);
      this.snackBar.open(`${order.code} marked as ${this.labels[status].toLowerCase()}`);
    } catch (err) {
      console.error(err);
      this.snackBar.open('Could not update the order status.', 'Close');
    }
  }
}

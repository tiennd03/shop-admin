import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ORDER_STATUS_LABELS, Order } from '../../core/models';

@Component({
  selector: 'app-order-detail-dialog',
  imports: [MatDialogModule, MatButtonModule, CurrencyPipe, DatePipe],
  template: `
    <h2 mat-dialog-title>Order {{ order.code }}</h2>
    <mat-dialog-content>
      <div class="meta">
        <div>
          <div class="label">Customer</div>
          <div>{{ order.customerName }}</div>
          <div class="muted">{{ order.customerEmail }}</div>
        </div>
        <div>
          <div class="label">Placed</div>
          <div>{{ order.createdAt | date: 'medium' }}</div>
          <span [class]="'badge status-' + order.status">{{ labels[order.status] }}</span>
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>Item</th>
            <th class="num">Qty</th>
            <th class="num">Price</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          @for (item of order.items; track item.productId) {
            <tr>
              <td>{{ item.name }}</td>
              <td class="num">{{ item.quantity }}</td>
              <td class="num">{{ item.price | currency: 'USD' }}</td>
              <td class="num">{{ item.price * item.quantity | currency: 'USD' }}</td>
            </tr>
          }
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total</td>
            <td class="num">{{ order.total | currency: 'USD' }}</td>
          </tr>
        </tfoot>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 4px;
    }
    .badge {
      margin-top: 6px;
    }
    .items {
      width: 100%;
      border-collapse: collapse;
      th,
      td {
        padding: 8px 4px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        text-align: left;
      }
      th {
        font-weight: 500;
        color: var(--mat-sys-on-surface-variant);
      }
      tfoot td {
        font-weight: 600;
        border-bottom: none;
      }
    }
  `,
})
export class OrderDetailDialogComponent {
  protected readonly order = inject<Order>(MAT_DIALOG_DATA);
  protected readonly labels = ORDER_STATUS_LABELS;
}

import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, of } from 'rxjs';
import {
  LOW_STOCK_THRESHOLD,
  PRODUCT_CATEGORIES,
  Product,
  ProductInput,
  normalizeText,
} from '../../core/models';
import { ProductService } from '../../core/product.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog.component';
import { ProductFormDialogComponent } from './product-form-dialog.component';

@Component({
  selector: 'app-product-list',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly lowStock = LOW_STOCK_THRESHOLD;
  protected readonly columns = ['name', 'category', 'price', 'stock', 'status', 'actions'];

  protected readonly search = signal('');
  protected readonly category = signal<string>('all');
  protected readonly loadError = signal<string | null>(null);

  /** null while the first snapshot is loading */
  private readonly products = toSignal(
    this.productService.products$.pipe(
      catchError((err) => {
        console.error(err);
        this.loadError.set('Could not load products. Check your Firestore rules and connection.');
        return of([] as Product[]);
      }),
    ),
    { initialValue: null },
  );

  protected readonly loading = computed(() => this.products() === null);
  protected readonly total = computed(() => this.products()?.length ?? 0);

  protected readonly filtered = computed(() => {
    const query = normalizeText(this.search());
    const category = this.category();
    return (this.products() ?? []).filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!query || normalizeText(p.name).includes(query) || normalizeText(p.sku).includes(query)),
    );
  });

  protected readonly dataSource = new MatTableDataSource<Product>([]);
  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.data = this.filtered();
    });
    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });
  }

  protected clearFilters(): void {
    this.search.set('');
    this.category.set('all');
  }

  protected openForm(product?: Product): void {
    this.dialog
      .open<ProductFormDialogComponent, Product | null, ProductInput>(ProductFormDialogComponent, {
        data: product ?? null,
        width: '600px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe(async (input) => {
        if (!input) return;
        try {
          if (product) {
            await this.productService.update(product.id, input);
            this.snackBar.open(`Saved “${input.name}”`);
          } else {
            await this.productService.create(input);
            this.snackBar.open(`Added “${input.name}”`);
          }
        } catch (err) {
          console.error(err);
          this.snackBar.open('Could not save the product. Please try again.', 'Close');
        }
      });
  }

  protected confirmDelete(product: Product): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Delete product?',
          message: `“${product.name}” will be permanently removed. Existing orders keep their copy of the item.`,
          confirmText: 'Delete',
        },
      })
      .afterClosed()
      .subscribe(async (confirmed) => {
        if (!confirmed) return;
        try {
          await this.productService.remove(product.id);
          this.snackBar.open(`Deleted “${product.name}”`);
        } catch (err) {
          console.error(err);
          this.snackBar.open('Could not delete the product.', 'Close');
        }
      });
  }
}

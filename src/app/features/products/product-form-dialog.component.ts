import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  PRODUCT_CATEGORIES,
  Product,
  ProductCategory,
  ProductInput,
  ProductStatus,
} from '../../core/models';

/** Create / edit form. Closes with the cleaned-up ProductInput, or undefined if cancelled. */
@Component({
  selector: 'app-product-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrl: './product-form-dialog.component.scss',
})
export class ProductFormDialogComponent {
  protected readonly product = inject<Product | null>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ProductFormDialogComponent, ProductInput>>(MatDialogRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly isEdit = !!this.product;

  protected readonly form = this.fb.group({
    name: [this.product?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    sku: [
      this.product?.sku ?? '',
      [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+$/), Validators.maxLength(40)],
    ],
    category: this.fb.control<ProductCategory>(this.product?.category ?? PRODUCT_CATEGORIES[0], Validators.required),
    price: [this.product?.price ?? 0, [Validators.required, Validators.min(0.01)]],
    stock: [
      this.product?.stock ?? 0,
      [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)],
    ],
    status: this.fb.control<ProductStatus>(this.product?.status ?? 'active'),
    description: [this.product?.description ?? '', Validators.maxLength(500)],
  });

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...value,
      name: value.name.trim(),
      sku: value.sku.trim().toUpperCase(),
      description: value.description.trim(),
      price: Math.round(Number(value.price) * 100) / 100,
      stock: Number(value.stock),
    });
  }
}

import { Component, DestroyRef, ElementRef, afterRenderEffect, inject, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * Thin wrapper around Chart.js. Pass a config signal; the chart is rebuilt whenever it changes.
 * Uses afterRenderEffect so the <canvas> is guaranteed to exist.
 */
@Component({
  selector: 'app-chart',
  template: `<div class="box" [style.height.px]="height()"><canvas #canvas></canvas></div>`,
  styles: `
    .box {
      position: relative;
      width: 100%;
    }
  `,
})
export class ChartComponent {
  // Generic `any` so bar, line and doughnut configs can all be passed in
  readonly config = input.required<ChartConfiguration<any, any, any>>();
  readonly height = input(280);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    afterRenderEffect(() => {
      const config = this.config();
      this.chart?.destroy();
      this.chart = new Chart(this.canvas().nativeElement, {
        ...config,
        options: { responsive: true, maintainAspectRatio: false, ...config.options },
      });
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}

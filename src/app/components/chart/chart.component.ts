import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {
    private _configuration: Subject<ChartConfiguration | undefined> = new BehaviorSubject(undefined);

  @Input() set configuration(value: ChartConfiguration) {
      console.log('change', value);
      this._configuration.next(value);
  }
  @ViewChild('myChart') canvas: ElementRef;

  chart: Chart;

  showChart(canvas: HTMLCanvasElement, conf: ChartConfiguration) {
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (this.chart) {
        this.chart.destroy();
      }

      this.chart = new Chart(ctx, conf);
    }
  }

  ngOnInit() {
    this._configuration.do(console.log).subscribe();
    this._configuration.asObservable().subscribe(
      conf => {
        if (conf) {
          this.showChart(this.canvas.nativeElement, conf);
        }
      },
    );
  }
}

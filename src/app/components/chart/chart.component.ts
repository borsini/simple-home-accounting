import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, SimpleChanges } from '@angular/core';
import  { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements OnInit {

    @Input() set configuration(value : ChartConfiguration) {
        console.log('change')
        this.showChart(this.canvas.nativeElement, value)
    }
    @ViewChild('myChart') canvas: ElementRef;
  
  chart: Chart;

  showChart(canvas: HTMLCanvasElement, conf : ChartConfiguration) {
    const ctx = canvas.getContext('2d');

    if(ctx){
      this.chart = new Chart(ctx, conf);
    }
  }

  ngOnInit() {
    
  }

}
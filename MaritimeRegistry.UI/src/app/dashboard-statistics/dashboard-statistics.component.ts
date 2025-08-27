import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Chart, ChartType, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-dashboard-statistics',
  templateUrl: './dashboard-statistics.component.html',
  styleUrls: ['./dashboard-statistics.component.css']
})
export class DashboardStatisticsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('typeChart') typeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('flagChart') flagChartRef!: ElementRef<HTMLCanvasElement>;
  
  totalShips = 1245;
  recentShips = [
    { name: 'Sea Star', flag: 'France' },
    { name: 'Blue Horizon', flag: 'Panama' },
    { name: 'West Wind', flag: 'Malta' }
  ];

  private typeChart?: Chart<'doughnut'>;
  private flagChart?: Chart<'bar'>;

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    this.initCharts();
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.initCharts();
  };

  private initCharts(): void {
    this.destroyCharts();
    this.createTypeChart();
    this.createFlagChart();
  }

  private destroyCharts(): void {
    this.typeChart?.destroy();
    this.flagChart?.destroy();
  }

  private createTypeChart(): void {
    const ctx = this.typeChartRef.nativeElement;
    this.typeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Cargo', 'Tanker', 'Passenger', 'Specialized', 'Other'],
        datasets: [{
          data: [45, 30, 10, 10, 5],
          backgroundColor: [
            '#213448',
            '#113F67',
            '#3674B5',
            '#F5F0CD',
            '#FADA7A'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 20
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  private createFlagChart(): void {
    const ctx = this.flagChartRef.nativeElement;
    this.flagChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Panama', 'France', 'Malta'],
        datasets: [{
          label: 'Nombre de navires',
          data: [420, 315, 180, 150, 90, 75],
          backgroundColor: '#3498db',
          borderColor: '#2980b9',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }
}
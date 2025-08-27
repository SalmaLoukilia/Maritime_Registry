import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent
  ],
  template: `
    <div class="app-container">
      <app-navbar *ngIf="shouldShowNavbar()"></app-navbar>
      <main [class]="getMainClass()">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .main-content {
      flex: 1;
      padding-top: 70px; 
    }
    
    .login-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class AppComponent {
  title = 'MaritimeRegistry.UI';

  constructor(private router: Router) {
    console.log('AppComponent initialized');
    console.log('Initial URL:', this.router.url);
    console.log('Router configuration:', this.router.config);
    this.router.events.subscribe((event) => {
      console.log('Router event:', event);
      if (event instanceof NavigationEnd) {
        console.log('Navigation ended:', event.url);
        console.log('Should show navbar:', this.shouldShowNavbar());
      }
    });
  }

  shouldShowNavbar(): boolean {
    const shouldShow = !(this.router.url.includes('/login') || this.router.url.includes('/dashboard-admin'));
    console.log('shouldShowNavbar called, URL:', this.router.url, 'Result:', shouldShow);
    return shouldShow;
  }

  getMainClass(): string {
    return this.shouldShowNavbar() ? 'main-content' : 'login-content';
  }
}
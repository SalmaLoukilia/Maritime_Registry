import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/login/login.component';
import { NaviresComponent } from './features/navires/navires.component';
import { DashboardAdminComponent } from './features/dashboard-admin/dashboard-admin.component';

const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('maritime_token') || sessionStorage.getItem('maritime_token');
  if (!token) {
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  
  { 
    path: 'navires', 
    component: NaviresComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'dashboard-admin', 
    component: DashboardAdminComponent,
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '/home' }
];
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class NavbarComponent {
  flagStates = ['France', 'Panama', 'Malta'];
  selectedState = 'France';

  constructor(private router: Router, private authService: AuthService) {
    console.log('NavbarComponent initialized');
  }

  onLogin() {
    console.log('=== LOGIN BUTTON CLICKED ===');
    this.authService.logout();
    
    console.log('Cleared authentication tokens');
    console.log('Current URL:', this.router.url);
    console.log('Attempting to navigate to /login');
    
    this.router.navigate(['/login']).then((result) => {
      console.log('Navigation result:', result);
      console.log('New URL:', this.router.url);
    }).catch((error) => {
      console.error('Navigation error:', error);
    });
  }

  onTestClick() {
    console.log('=== TEST BUTTON CLICKED ===');
    alert('Test button works!');
  }
}

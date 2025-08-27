import { Component, Inject, PLATFORM_ID, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isBrowser: boolean;
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService, 
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]], 
      password: ['', [Validators.required, Validators.minLength(3)]], 
      rememberMe: [false]
    });
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit() {
    console.log('LoginComponent initialisé');
    if (this.isBrowser) {
      setTimeout(() => {
        this.createCharts();
      }, 100);
    }
  }

  async createCharts() {
    if (this.isBrowser) {
      try {
        const Chart = await import('chart.js');
        this.createShipsChart(Chart.default || Chart);
      } catch (error) {
        console.error('Error loading Chart.js:', error);
      }
    }
  }

  createShipsChart(Chart: any) {
    if (!this.chartCanvas?.nativeElement) {
      console.warn('Canvas element not found');
      return;
    }
    
    new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
          label: '# of Votes',
          data: [12, 19, 3, 5, 2, 3],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      console.log('Début de la tentative de connexion...');
      const credentials: LoginRequest = {
        nom_utilisateur: this.loginForm.get('username')?.value,
        mot_de_passe: this.loginForm.get('password')?.value
      };

      console.log('Credentials préparés:', credentials);

      const rememberMe = this.loginForm.get('rememberMe')?.value;

      this.authService.login(credentials, rememberMe).subscribe({
        next: (response) => {
          console.log('Réponse reçue du service:', response);
          this.isLoading = false;
          if (response.success && response.user) {
            console.log('Connexion réussie, redirection selon rôle:', response.user.role);
            
            const role = response.user.role.toLowerCase();
            if (role === 'admin' || role === 'administrateur') {
              console.log('Redirection vers dashboard-admin');
              this.router.navigate(['/dashboard-admin']);
            } else if (role === 'inspecteur') {
              console.log('Redirection vers home (temporaire)');
              this.router.navigate(['/home']); 
            } else {
              console.log('Redirection vers home (par défaut)');
              this.router.navigate(['/home']);
            }
          } else {
            console.log('Échec de la connexion:', response.message);
            this.errorMessage = response.message || 'Identifiants invalides';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur de connexion:', error);
          console.error('Détails de l\'erreur:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          
          if (error.status === 401) {
            this.errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
          } else if (error.status === 0) {
            this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez si l\'API fonctionne sur http://localhost:5141';
          } else if (error.status === 500) {
            this.errorMessage = 'Erreur interne du serveur. Vérifiez les logs de l\'API.';
          } else {
            this.errorMessage = `Erreur de connexion (${error.status}): ${error.message}`;
          }
        }
      });
    } else {
      console.log('❌ Formulaire invalide:', this.loginForm.errors);
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement';
    }
  }
}
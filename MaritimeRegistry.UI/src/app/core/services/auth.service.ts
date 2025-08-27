// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginRequest {
  nom_utilisateur: string;
  mot_de_passe: string;
}

export interface UserInfo {
  utilisateur_id: number;
  nom_utilisateur: string;
  role: string;
  email?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: UserInfo;
  message?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5141/api'; // Votre URL API
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Vérifier si un utilisateur est déjà connecté
    this.checkExistingAuth();
  }

  private checkExistingAuth(): void {
    const token = localStorage.getItem('maritime_token') || sessionStorage.getItem('maritime_token');
    const userStr = localStorage.getItem('maritime_user') || sessionStorage.getItem('maritime_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest, rememberMe: boolean = true): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('🔐 Tentative de connexion avec:', credentials);
    console.log('📡 URL de l\'API:', `${this.apiUrl}/auth/login`);
    console.log('📦 Données envoyées:', JSON.stringify(credentials));

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials, { headers })
      .pipe(
        tap(response => {
          console.log('✅ Réponse de l\'API reçue:', response);
          if (response.success && response.user) {
            console.log('👤 Utilisateur connecté:', response.user);
            // Stocker les informations de connexion
            const storage = rememberMe ? localStorage : sessionStorage;
            
            // Générer un token simple (en production, utilisez JWT)
            const token = `maritime_${Date.now()}_${response.user.utilisateur_id}`;
            
            storage.setItem('maritime_token', token);
            storage.setItem('maritime_user', JSON.stringify(response.user));
            
            // Pour compatibilité avec l'ancien code
            storage.setItem('currentUser', JSON.stringify(response.user));
            storage.setItem('authToken', token);
            
            // Mettre à jour le sujet
            this.currentUserSubject.next(response.user);
            console.log('💾 Informations stockées dans le navigateur');
          } else {
            console.log('❌ Échec de la connexion:', response.message);
          }
        })
      );
  }

  logout(): void {
    // Nettoyer le stockage
    localStorage.removeItem('maritime_token');
    localStorage.removeItem('maritime_user');
    sessionStorage.removeItem('maritime_token');
    sessionStorage.removeItem('maritime_user');
    
    // Réinitialiser le sujet
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('maritime_token') || sessionStorage.getItem('maritime_token');
    return !!token;
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }
}
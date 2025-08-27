import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Navire {
  id: string;
  nom: string;
  type: string;
  immatriculation: string;
  longueur: number;
  largeur: number;
  tirantEau: number;
  jaugeBrute: number;
  jaugeNette: number;
  puissanceMoteur: number;
  dateConstruction: Date;
  dateEnregistrement: Date;
  statut: 'Actif' | 'Inactif' | 'Maintenance' | 'Retiré';
  proprietaire: string;
  portAttache: string;
  numeroIMO?: string;
  numeroMMSI?: string;
}

export interface NavireStats {
  total: number;
  actifs: number;
  maintenance: number;
  retires: number;
}

@Injectable({
  providedIn: 'root'
})
export class NaviresService {
  private apiUrl = 'https://localhost:7000/api/navires';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtenir tous les navires
   */
  
}
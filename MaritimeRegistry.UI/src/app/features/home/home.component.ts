import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { DecimalPipe } from '@angular/common';
import { DashboardStatisticsComponent } from '../../dashboard-statistics/dashboard-statistics.component';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/navbar/navbar.component';




interface Navire {
  Imo: number;
  Nom_Navire: string;
  Statut: string;
  Type_Navire: { Type_Navire_Id: number; Type: string };
  Pavillon: { Pavillon_Id: number; Pays: string };
  Port: { Port_Id: number; Nom_Port: string; Pays: string };
  Armateur: { Armateur_Id: number; Nom_Armateur: string; Contact: string };
}

interface CertificatRequest {
  Imo: number;
  OwnerEmail: string;
  Type_Certif_Id: number;
}

interface CertificatResponse {
  certificat_id?: number;
  type_certif: string;
  date_delivrance: string;
  date_expiration: string;
  imo: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, DecimalPipe, DashboardStatisticsComponent, FormsModule, NavbarComponent],
  providers: [DecimalPipe],
  animations: [
    trigger('fadeIn', [
      state('in', style({ opacity: 1 })),
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s ease-out')
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('shipsChart') shipsChartRef!: ElementRef;
  @ViewChild('tonnageChart') tonnageChartRef!: ElementRef;
  @ViewChild('shipTypeChart') shipTypeChartRef!: ElementRef;

  services = [
    {
      title: 'Vessel Registration',
      description: 'Easily register a vessel under the RMI flag. Access full guidance on registration requirements, documentation, and eligibility criteria for both new and existing ships.',
      link: '/corporate'
    },
    {
      title: 'Inspection & Licensing',
      description: 'Find details about vessel inspection schedules, compliance checks, and how to obtain or renew licenses such as ship radio or port operation permits.',
      link: '/maritime'
    },
    {
      title: 'Yacht Registration',
      description: 'Register private or commercial yachts based on size, usage, and location. Understand the legal requirements and services provided for smooth operation.',
      link: '/yacht'
    },
    {
      title: 'Seafarer Certification',
      description: 'Manage crew documentation, apply for or renew seafarer certificates, and verify certificate authenticity via our official database.',
      link: '/seafarers'
    }
  ];

  stats = [
    { id: 1, title: 'Vessels Registered', value: 12543, trend: 2.4, icon: '/assets/icons/ship.svg' },
    { id: 2, title: 'Total Tonnage', value: 52800000, trend: 1.8, icon: '/assets/icons/tonnage.svg' },
    { id: 3, title: 'Flag States', value: 82, trend: 0.5, icon: '/assets/icons/flag.svg' },
    { id: 4, title: 'New Registrations (30d)', value: 327, trend: -1.2, icon: '/assets/icons/new.svg' }
  ];

  totalShips = 12453;
  shipGrowth = 4.2;
  totalTonnage = 48256700;
  tonnageGrowth = 1.8;
  flagCount = 78;
  newShips30d = 342;
  prevMonthShips = 298;

  topFlags = [
    { country: 'Panama', emoji: '🇵🇦' },
    { country: 'Liberia', emoji: '🇱🇷' },
    { country: 'Marshall Islands', emoji: '🇲🇭' },
    { country: 'Malta', emoji: '🇲🇹' }
  ];

  newsList = [
    {
      title: 'New Ship Registration Guidelines',
      content: 'Updated procedures have been introduced to streamline the registration process of new vessels.',
      date: new Date(2025, 6, 21),
      tag: 'Regulation',
      imageUrl: 'assets/images/news1.jpg'
    },
    {
      title: 'Scheduled System Maintenance',
      content: 'The Maritime Registry System will be unavailable from 12 AM to 4 AM on July 30 for updates.',
      date: new Date(2025, 6, 18),
      tag: 'Maintenance',
      imageUrl: 'assets/images/news2.jpg'
    },
    {
      title: 'Maritime Safety Forum 2025',
      content: 'Join the international forum discussing ship safety and inspection standards, live on August 3.',
      date: new Date(2025, 6, 15),
      tag: 'Event',
      imageUrl: 'assets/images/news3.jpg'
    }
  ];

  faqList = [
    {
      question: 'How can I register a new ship in the system?',
      answer: 'You can register a new ship by accessing the registration form...',
      open: false
    },
    {
      question: 'What documents are required for vessel registration?',
      answer: 'You will need proof of ownership, safety certificates...',
      open: false
    },
    {
      question: 'How can I update ship information after registration?',
      answer: 'After login, navigate to your ship profile...',
      open: false
    },
    {
      question: 'What are the fees associated with ship registration?',
      answer: 'Fees vary based on ship type and size. Please refer to our fee schedule...',
      open: false
    },
    {
      question: 'How do I renew my ship registration?',
      answer: 'Renewal can be done online through your account dashboard...',
      open: false
    },
    {
      question: 'Puis-je modifier les informations d\u2019un navire d\u00e9j\u00e0 enregistr\u00e9 ?',
      answer: 'Oui, avec les droits appropri\u00e9s, vous pouvez mettre \u00e0 jour les informations d\u2019un navire depuis l\u2019interface d\u00e9di\u00e9e.',
      open: false
    }
  ];

  searchQuery = '';
  showCertificateRequestForm = false;
  certificateRequestForm: CertificatRequest = {
    Imo: 0,
    OwnerEmail: '',
    Type_Certif_Id: 0
  };
  shipDetails: Navire | null = null;
  imoError: string | null = null;
  emailError: string | null = null;
  formErrors: string | null = null;
  isLoading = false;

  private apiUrl = 'http://localhost:5141/api';
  private certifTypeMap: { [key: number]: string } = {
    1: 'Load Line Certificate',
    2: 'Passenger Ship Safety Certificate',
    3: 'Safety Equipment Certificate',
    4: 'International Pollution Prevention Certificate (MARPOL)',
    5: 'Safety Radio Certificate',
    6: 'International Tonnage Certificate',
    7: 'Safety Management Certificate (ISM Code)',
    8: 'Maritime Labour Certificate (MLC)'
  };
  private imoSubject = new Subject<number>();

  constructor(
    private decimalPipe: DecimalPipe,
    private http: HttpClient
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.imoSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(imo => {
      this.fetchShipDetails(imo);
    });
  }

  ngAfterViewInit(): void {
    this.createCharts();
  }

  ngOnDestroy(): void {
    this.imoSubject.complete();
  }

  navigateTo(link: string): void {
    console.log('Navigation vers:', link);
  }

  onRegisterVessel(): void {
    console.log('Navigate to vessel registration');
  }

  onViewServices(): void {
    console.log('Navigate to services');
  }

  openCertificateRequestForm(): void {
    this.showCertificateRequestForm = true;
    this.resetCertificateRequestForm();
  }

  cancelCertificateRequestForm(): void {
    this.showCertificateRequestForm = false;
    this.resetCertificateRequestForm();
  }

  resetCertificateRequestForm(): void {
    this.certificateRequestForm = {
      Imo: 0,
      OwnerEmail: '',
      Type_Certif_Id: 0
    };
    this.shipDetails = null;
    this.imoError = null;
    this.emailError = null;
    this.formErrors = null;
    this.isLoading = false;
  }

  onImoChange(): void {
    this.imoError = null;
    if (this.certificateRequestForm.Imo) {
      this.imoSubject.next(this.certificateRequestForm.Imo);
    } else {
      this.shipDetails = null;
    }
  }

  onEmailChange(): void {
    this.emailError = null;
  }

  isFormValid(): boolean {
    return !!this.certificateRequestForm.Imo && 
           !!this.certificateRequestForm.OwnerEmail && 
           !!this.certificateRequestForm.Type_Certif_Id &&
           !this.imoError && 
           !this.emailError;
  }

  private async fetchShipDetails(imo: number): Promise<void> {
    if (!/^\d{7}$/.test(imo.toString())) {
      this.imoError = 'IMO doit être un nombre à 7 chiffres.';
      this.shipDetails = null;
      return;
    }

    try {
      const navire = await firstValueFrom(this.http.get<Navire>(`${this.apiUrl}/Ships/${imo}`));
      this.shipDetails = navire;
      
    
      if (this.certificateRequestForm.OwnerEmail && 
          navire.Armateur?.Contact !== this.certificateRequestForm.OwnerEmail) {
        this.imoError = 'Le numéro IMO et l\'email ne correspondent pas à nos enregistrements.';
      } else {
        this.imoError = null;
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des détails du navire:', error);
      this.shipDetails = null;
      this.imoError = 'Navire non trouvé. Veuillez vérifier le numéro IMO.';
    }
  }

  private async verifyEmailMatchesShip(): Promise<boolean> {
    if (!this.certificateRequestForm.Imo || !this.certificateRequestForm.OwnerEmail) {
      return false;
    }

    try {
      const navire = await firstValueFrom(this.http.get<Navire>(`${this.apiUrl}/Ships/${this.certificateRequestForm.Imo}`));
      return navire.Armateur?.Contact === this.certificateRequestForm.OwnerEmail;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      return false;
    }
  }

  async submitCertificateRequestForm(): Promise<void> {
    this.formErrors = null;
    this.isLoading = true;
    
    if (!this.certificateRequestForm.Imo || 
        !this.certificateRequestForm.OwnerEmail || 
        !this.certificateRequestForm.Type_Certif_Id) {
      this.formErrors = 'Veuillez remplir tous les champs obligatoires.';
      this.isLoading = false;
      return;
    }

    if (!/^\d{7}$/.test(this.certificateRequestForm.Imo.toString())) {
      this.imoError = 'IMO doit être un nombre à 7 chiffres.';
      this.isLoading = false;
      return;
    }

    if (!this.certifTypeMap[this.certificateRequestForm.Type_Certif_Id]) {
      this.formErrors = 'Type de certificat invalide.';
      this.isLoading = false;
      return;
    }

    const isEmailValid = await this.verifyEmailMatchesShip();
    if (!isEmailValid) {
      this.emailError = 'L\'email ne correspond pas au propriétaire enregistré pour ce numéro IMO.';
      this.isLoading = false;
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<CertificatResponse>(`${this.apiUrl}/Certificate/request`, this.certificateRequestForm)
      );
      
      alert('Demande de certificat soumise avec succès!');
      this.cancelCertificateRequestForm();
    } catch (error: any) {
      console.error('Erreur lors de la soumission du certificat:', error);
      let errorMessage = 'Une erreur inattendue s\'est produite.';
      
      if (error.status === 404) {
        errorMessage = 'Endpoint API non trouvé. Veuillez vérifier si le serveur backend est en cours d\'exécution.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Données invalides fournies.';
      } else if (error.status === 500) {
        errorMessage = error.error?.message || 'Une erreur serveur s\'est produite.';
      } else if (error.status === 0) {
        errorMessage = 'Erreur réseau. Veuillez vérifier votre connexion ou le serveur backend.';
      }
      
      this.formErrors = `Échec de la soumission de la demande de certificat: ${errorMessage}`;
    } finally {
      this.isLoading = false;
    }
  }

  filteredFaqs() {
    const query = this.searchQuery.toLowerCase();
    return this.faqList.filter(faq =>
      faq.question.toLowerCase().includes(query)
    );
  }

  toggleFAQ(index: number) {
    const realIndex = this.faqList.findIndex(f =>
      f.question === this.filteredFaqs()[index].question
    );
    this.faqList[realIndex].open = !this.faqList[realIndex].open;
  }

  private createCharts(): void {
    this.createShipsChart();
    this.createTonnageChart();
    this.createShipTypeChart();
  }

  private createShipsChart(): void {
    new Chart(this.shipsChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          data: [120, 190, 170, 220, 210, 195],
          borderColor: '#578FCA',
          tension: 0.4,
          fill: false,
          borderWidth: 2
        }]
      },
      options: this.getSmallChartOptions()
    });
  }

  private createTonnageChart(): void {
    new Chart(this.tonnageChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          data: [4200, 3900, 4100, 3800, 4000, 4300],
          borderColor: '#DDA853',
          tension: 0.4,
          fill: false,
          borderWidth: 2
        }]
      },
      options: this.getSmallChartOptions()
    });
  }

  private createShipTypeChart(): void {
    new Chart(this.shipTypeChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Cargo', 'Tanker', 'Passenger Ship', 'Container', 'Fishing', 'Special'],
        datasets: [{
          label: 'Navires par Type',
          data: [4200, 3200, 1800, 2400, 1500, 800],
          backgroundColor: [
            '#578FCA',
            '#113F67',
            '#DDA853',
            '#58A0C8',
            '#34699A',
            '#9B7D4D'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  private getSmallChartOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } },
      elements: { point: { radius: 0 } }
    };
  }
}
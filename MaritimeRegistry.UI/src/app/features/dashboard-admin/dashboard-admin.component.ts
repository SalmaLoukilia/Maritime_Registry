import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

Chart.register(...registerables);

interface User {
  utilisateur_id: number;
  nom_utilisateur: string;
  email: string;
  role: string;
}

interface Ship {
  Imo: number;
  Nom_Navire: string;
  Type: string;
  Flag: string;
  Statut: string;
  Owner?: string;
  Port?: string;
  Type_Navire_Id?: number;
  Pavillon_Id?: number;
  Armateur_Id?: number;
  Port_Id?: number;
}

interface Stats {
  totalShips: number;
  totalCertificates: number;
  totalInspections: number;
  totalOwners: number;
  scheduledInspections: number;
  totalUsers: number;
}

interface ShipType { Type_Navire_Id: number; Type: string; }
interface Flag { Pavillon_Id: number; Pays: string; }
interface Owner { Armateur_Id: number; Nom_Armateur: string; Contact: string; }
interface PortEntity { Port_Id: number; Nom_Port: string; }
interface CertificateType { Type_Certif_Id: number; Nom: string; }

interface Certificate {
  Certificat_Id: number;
  Type_Certif: string;
  Date_Delivrance: Date;
  Date_Expiration: Date;
  Imo: number;
  Status: 'Active' | 'Cancelled' | 'Withdrawn' | 'Expired';
  Revalidations?: { Date: Date; Note: string }[];
}

interface Inspection {
  Inspection_Id: number;
  Type: 'Initial' | 'Annual' | 'Unannounced' | 'After Damage';
  Date_Visite: Date;
  Due_Date: Date;
  Resultat: string;
  Observations: string;
  Imo: number;
}

interface CertificateRequest {
  Request_Id: number;
  Imo: number;
  Type_Certif_Id: number;
  Type_Certif: string;
  Category: string;
  Status: 'Pending' | 'Validated' | 'Rejected';
  Submitted_Date: Date;
  Documents?: File[];
}

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
  standalone: true,
  imports: [DatePipe, CommonModule, HttpClientModule, FormsModule],
})
export class DashboardAdminComponent implements OnInit, AfterViewInit {
  activeSection: string = 'overview';
  adminName: string = '';
  isLoading: boolean = true;
  isArmateur: boolean = false;
  myShips: number[] = [];

  stats: Stats = {
    totalShips: 0,
    totalCertificates: 0,
    totalInspections: 0,
    totalOwners: 0,
    scheduledInspections: 0,
    totalUsers: 0
  };

  users: User[] = [];
  ships: Ship[] = [];
  owners: Owner[] = [];
  certificates: Certificate[] = [];
  inspections: Inspection[] = [];
  certificateRequests: CertificateRequest[] = [];

  showUserForm = false;
  showShipForm = false;
  showOwnerForm = false;
  showCertificateForm = false;
  showInspectionForm = false;
  showPortForm = false;
  showShipTypeForm = false;
  showCertificateTypeForm = false;
  showFlagForm = false;
  showCertificateRequestForm = false;
  isEditMode = false;

  selectedShipType: string = '';
  selectedFlag: string = '';
  selectedPort: string = '';

  showCertificateView = false;
  selectedCertificate!: Certificate;
  showInspectionView = false;
  selectedInspection!: Inspection;
  showOwnerView = false;
  selectedOwner!: Owner;

  selectedSection: string = 'ships';

  userForm: any = this.getEmptyUserForm();
  shipForm: any = this.getEmptyShipForm();
  ownerForm: any = this.getEmptyOwnerForm();
  certificateForm: any = this.getEmptyCertificateForm();
  inspectionForm: any = this.getEmptyInspectionForm();
  portForm: any = this.getEmptyPortForm();
  shipTypeForm: any = this.getEmptyShipTypeForm();
  certificateTypeForm: any = this.getEmptyCertificateTypeForm();
  flagForm: any = this.getEmptyFlagForm();
  certificateRequestForm: any = this.getEmptyCertificateRequestForm();

  shipTypes: ShipType[] = [];
  flags: Flag[] = [];
  ports: PortEntity[] = [];
  certificateTypes: CertificateType[] = [];

  activeCodifTab: 'ports' | 'shipTypes' | 'certificateTypes' | 'flags' = 'ports';

  certificateSearchTerm: string = '';
  certificateFilterShip: string = '';
  get filteredCertificates(): Certificate[] {
    return this.certificates.filter(cert => 
      (!this.isArmateur || this.myShips.includes(cert.Imo)) &&
      (this.certificateFilterShip === '' || cert.Imo.toString() === this.certificateFilterShip) &&
      (cert.Type_Certif.toLowerCase().includes(this.certificateSearchTerm.toLowerCase()) || cert.Imo.toString().includes(this.certificateSearchTerm))
    );
  }

  inspectionSearchTerm: string = '';
  inspectionFilterType: string = '';
  inspectionFilterShip: string = '';
  inspectionDateFrom: Date | null = null;
  inspectionDateTo: Date | null = null;
  get filteredInspections(): Inspection[] {
    return this.inspections.filter(insp => 
      (this.inspectionFilterType === '' || insp.Type === this.inspectionFilterType) &&
      (this.inspectionFilterShip === '' || insp.Imo.toString() === this.inspectionFilterShip) &&
      (!this.inspectionDateFrom || insp.Date_Visite >= this.inspectionDateFrom) &&
      (!this.inspectionDateTo || insp.Date_Visite <= this.inspectionDateTo) &&
      (insp.Observations.toLowerCase().includes(this.inspectionSearchTerm.toLowerCase()) || insp.Imo.toString().includes(this.inspectionSearchTerm))
    );
  }

  ownerSearchTerm: string = '';
  get filteredOwners(): Owner[] {
    return this.owners.filter(owner => 
      owner.Nom_Armateur.toLowerCase().includes(this.ownerSearchTerm.toLowerCase()) || 
      owner.Contact.toLowerCase().includes(this.ownerSearchTerm.toLowerCase())
    );
  }

  get filteredCertificateRequests(): CertificateRequest[] {
    return this.certificateRequests.filter(req => 
      !this.isArmateur || this.myShips.includes(req.Imo)
    );
  }

  now: Date = new Date();

  private apiUrl = 'http://localhost:5141/api';

  @ViewChild('shipsByTypeChart') shipsByTypeChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('certificateComplianceChart') certificateComplianceChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('inspectionsByTypeChart') inspectionsByTypeChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ownersByNationalityChart') ownersByNationalityChart!: ElementRef<HTMLCanvasElement>;

  constructor(private router: Router, private http: HttpClient) {
    this.ownerSearchTerm = ''; 
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  private loadCurrentUser(): void {
  this.isLoading = true;
  const storedUser = localStorage.getItem('currentUser');
  
  if (storedUser) {
    const user = JSON.parse(storedUser);
    this.adminName = user.nom_utilisateur || user.Nom_Utilisateur || '';
    this.isArmateur = user.role === 'Armateur' || user.Role === 'Armateur';
    this.isLoading = false;
    
    if (this.isArmateur) {
      this.fetchMyShips(user.utilisateur_id || user.Utilisateur_Id);
    } else {
      this.loadDashboardData();
    }
  } else {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.http.get(`${this.apiUrl}/auth/me?utilisateur_id=${userId}`).subscribe(
        (response: any) => {
          this.adminName = response.nom_utilisateur || response.Nom_Utilisateur || '';
          this.isArmateur = response.role === 'Armateur' || response.Role === 'Armateur';
          this.isLoading = false;
          localStorage.setItem('currentUser', JSON.stringify(response));
          
          if (this.isArmateur) {
            this.fetchMyShips(response.utilisateur_id || response.Utilisateur_Id);
          } else {
            this.loadDashboardData();
          }
        },
        error => {
          console.error('Error fetching current user:', error);
          this.isLoading = false;
        }
      );
    } else {
      this.isLoading = false;
    }
  }
}

  private fetchMyShips(userId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/armateurs/${userId}/ships`).subscribe(
      (response) => {
        this.myShips = response.map(ship => ship.Imo);
        this.loadDashboardData();
      },
      error => console.error('Error fetching user ships:', error)
    );
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
    if (section === 'ships' || section === 'certificates' || section === 'inspections' || section === 'owners' || section === 'settings' || section === 'certificate-requests') {
      this.loadLookups();
    }
    if (section === 'certificates') this.fetchCertificates();
    if (section === 'inspections') this.fetchInspections();
    if (section === 'owners') this.fetchOwners();
    if (section === 'certificate-requests') this.fetchCertificateRequests();
    if (section === 'overview') this.renderCharts();
  }

  getSectionTitle(): string {
    const titles: { [key: string]: string } = {
      'overview': 'Overview',
      'users': 'User Management',
      'ships': 'Ship Management',
      'certificates': 'Certificate Management',
      'certificate-requests': 'Certificate Requests',
      'inspections': 'Inspection Management',
      'owners': 'Ship Owner Management',
      'settings': 'Settings'
    };
    return titles[this.activeSection] || 'Maritime Registry';
  }

  loadDashboardData(): void {
    this.fetchStats();
    if (!this.isArmateur) {
      this.fetchUsers();
    }
    this.fetchShips();
    this.fetchOwners();
    this.fetchCertificates();
    this.fetchInspections();
    this.fetchCertificateRequests();
  }

  private fetchStats(): void {
    this.http.get(`${this.apiUrl}/stats`).subscribe(
      (response: any) => {
        this.stats = {
          totalUsers: response.totalUsers || 0,
          totalShips: response.totalShips || 0,
          totalCertificates: response.totalCertificates || 0,
          totalInspections: response.totalInspections || 0,
          totalOwners: response.totalOwners || 0,
          scheduledInspections: response.scheduledInspections || 0
        };
      },
      error => console.error('Error fetching stats:', error)
    );
  }

  private fetchUsers(): void {
    this.http.get<any[]>(`${this.apiUrl}/users`).subscribe(
      (response: any[]) => {
        console.log('API Users Response:', response);
        this.users = response.map(u => ({
          utilisateur_id: u.utilisateur_id ?? u.Utilisateur_Id ?? 0,
          nom_utilisateur: u.nom_utilisateur ?? u.Nom_Utilisateur ?? '',
          email: u.email ?? u.Email ?? '',
          role: u.role ?? u.Role ?? ''
        }));
        console.log('Mapped Users:', this.users);
      },
      error => {
        console.error('Error fetching users:', error);
        this.users = []; 
      }
    );
  }

  private fetchShips(): void {
    this.http.get<any[]>(`${this.apiUrl}/ships`).subscribe(
      (response) => {
        this.ships = response.map(ship => ({
          Imo: ship.Imo ?? ship.imo ?? 0,
          Nom_Navire: ship.Nom_Navire ?? ship.nom_Navire ?? ship.nom_navire ?? '',
          Type: ship.Type ?? ship.type ?? '',
          Flag: ship.Flag ?? ship.flag ?? '',
          Statut: ship.Statut ?? ship.statut ?? '',
          Owner: ship.Owner ?? ship.owner ?? '',
          Port: ship.Port ?? ship.port ?? '',
          Type_Navire_Id: ship.Type_Navire_Id ?? ship.type_navire_id ?? null,
          Pavillon_Id: ship.Pavillon_Id ?? ship.pavillon_id ?? null,
          Armateur_Id: ship.Armateur_Id ?? ship.armateur_id ?? null,
          Port_Id: ship.Port_Id ?? ship.port_id ?? null
        }));
      },
      error => console.error('Error fetching ships:', error)
    );
  }

  private fetchOwners(): void {
  this.http.get<any[]>(`${this.apiUrl}/armateurs`).subscribe(
    (response) => {
      console.log('Owners API Response:', response);
      
      this.owners = response.map(owner => ({
        Armateur_Id: owner.armateur_Id || owner.Armateur_Id || 0,
        Nom_Armateur: owner.nom_Armateur || owner.Nom_Armateur || '',
        Contact: owner.contact || owner.Contact || ''
      }));
      
      console.log('Mapped Owners:', this.owners);
      this.stats.totalOwners = this.owners.length;
    },
    error => {
      console.error('Error fetching owners:', error);
      this.owners = [];
    }
  );
}

  private fetchCertificates(): void {
    this.http.get<any[]>(`${this.apiUrl}/certificats`).subscribe(
      (response) => {
        this.certificates = response.map(cert => ({
          Certificat_Id: cert.certificat_id ?? cert.Certificat_Id ?? 0,
          Type_Certif: cert.type_certif ?? cert.Type_Certif ?? '',
          Date_Delivrance: new Date(cert.date_delivrance ?? cert.Date_Delivrance),
          Date_Expiration: new Date(cert.date_expiration ?? cert.Date_Expiration),
          Imo: cert.imo ?? cert.Imo ?? 0,
          Status: cert.status ?? cert.Status ?? 'Active',
          Revalidations: cert.revalidations ?? []
        }));
      },
      error => console.error('Error fetching certificates:', error)
    );
  }

  private fetchInspections(): void {
    this.http.get<any[]>(`${this.apiUrl}/inspections`).subscribe(
      (response) => {
        this.inspections = response.map(insp => ({
          Inspection_Id: insp.inspection_id ?? insp.Inspection_Id ?? 0,
          Type: insp.type ?? insp.Type ?? '',
          Date_Visite: new Date(insp.date_visite ?? insp.Date_Visite),
          Due_Date: new Date(insp.due_date ?? insp.Due_Date),
          Resultat: insp.resultat ?? insp.Resultat ?? '',
          Observations: insp.observations ?? insp.Observations ?? '',
          Imo: insp.imo ?? insp.Imo ?? 0
        }));
      },
      error => console.error('Error fetching inspections:', error)
    );
  }

  private fetchCertificateRequests(): void {
    this.http.get<any[]>(`${this.apiUrl}/certificate-requests`).subscribe(
      (response) => {
        this.certificateRequests = response.map(req => ({
          Request_Id: req.request_id ?? req.Request_Id ?? 0,
          Imo: req.imo ?? req.Imo ?? 0,
          Type_Certif_Id: req.type_certif_id ?? req.Type_Certif_Id ?? 0,
          Type_Certif: this.certificateTypes.find(t => t.Type_Certif_Id === (req.type_certif_id ?? req.Type_Certif_Id))?.Nom || '',
          Category: req.category ?? req.Category ?? '',
          Status: req.status ?? req.Status ?? 'Pending',
          Submitted_Date: new Date(req.submitted_date ?? req.Submitted_Date),
          Documents: req.documents ?? []
        }));
      },
      error => console.error('Error fetching certificate requests:', error)
    );
  }

  refreshData(): void {
    this.loadDashboardData();
    if (this.activeSection === 'overview') {
      this.renderCharts();
    }
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  private loadLookups(done?: () => void): void {
    let pending = 5;
    const next = () => { pending--; if (pending === 0 && done) done(); };

    this.http.get<any[]>(`${this.apiUrl}/typesnavire`).subscribe(
      res => { this.shipTypes = res as ShipType[]; next(); },
      err => { this.shipTypes = []; next(); }
    );

    this.http.get<any[]>(`${this.apiUrl}/pavillons`).subscribe(
      res => { this.flags = res as Flag[]; next(); },
      err => { this.flags = []; next(); }
    );

    this.http.get<any[]>(`${this.apiUrl}/armateurs`).subscribe(
      res => { this.owners = res as Owner[]; next(); },
      err => { this.owners = []; next(); }
    );

    this.http.get<any[]>(`${this.apiUrl}/ports`).subscribe(
      res => { this.ports = res as PortEntity[]; next(); },
      err => { this.ports = []; next(); }
    );

    this.http.get<any[]>(`${this.apiUrl}/typescertif`).subscribe(
      res => { this.certificateTypes = res as CertificateType[]; next(); },
      err => { this.certificateTypes = []; next(); }
    );
  }

  renderCharts(): void {
    const shipTypes = this.ships.reduce((acc, ship) => {
      acc[ship.Type] = (acc[ship.Type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    new Chart(this.shipsByTypeChart.nativeElement, {
      type: 'pie',
      data: {
        labels: Object.keys(shipTypes),
        datasets: [{
          label: 'Ships by Type',
          data: Object.values(shipTypes),
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0'],
          borderColor: ['#2E86C1', '#E74C3C', '#F1C40F', '#3498DB'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Ships by Type' }
        }
      }
    });

    const certCompliance = {
      Active: this.certificates.filter(c => c.Status === 'Active' && c.Date_Expiration >= this.now).length,
      Expired: this.certificates.filter(c => c.Status === 'Expired' || c.Date_Expiration < this.now).length,
      Cancelled: this.certificates.filter(c => c.Status === 'Cancelled').length,
      Withdrawn: this.certificates.filter(c => c.Status === 'Withdrawn').length
    };
    new Chart(this.certificateComplianceChart.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Active', 'Expired', 'Cancelled', 'Withdrawn'],
        datasets: [{
          label: 'Certificate Compliance',
          data: [certCompliance.Active, certCompliance.Expired, certCompliance.Cancelled, certCompliance.Withdrawn],
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0'],
          borderColor: ['#2E86C1', '#E74C3C', '#F1C40F', '#3498DB'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Certificate Compliance' }
        }
      }
    });

    const inspectionTypes = this.inspections.reduce((acc, insp) => {
      acc[insp.Type] = (acc[insp.Type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    new Chart(this.inspectionsByTypeChart.nativeElement, {
      type: 'doughnut',
      data: {
        labels: Object.keys(inspectionTypes),
        datasets: [{
          label: 'Inspections by Type',
          data: Object.values(inspectionTypes),
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0'],
          borderColor: ['#2E86C1', '#E74C3C', '#F1C40F', '#3498DB'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Inspections by Type' }
        }
      }
    });

    const ownerNationalities = this.ships.reduce((acc, ship) => {
      const flag = this.flags.find(f => f.Pays === ship.Flag)?.Pays || 'Unknown';
      acc[flag] = (acc[flag] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    new Chart(this.ownersByNationalityChart.nativeElement, {
      type: 'bar',
      data: {
        labels: Object.keys(ownerNationalities),
        datasets: [{
          label: 'Ship Owners by Nationality',
          data: Object.values(ownerNationalities),
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0'],
          borderColor: ['#2E86C1', '#E74C3C', '#F1C40F', '#3498DB'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Ship Owners by Nationality' }
        }
      }
    });
  }

  printCertificates(): void {
    const doc = new jsPDF();
    doc.text('Certificates Report', 20, 20);
    autoTable(doc, {
      head: [['ID', 'Type', 'Issue Date', 'Expiry Date', 'Ship IMO', 'Status']],
      body: this.filteredCertificates.map(cert => [
        cert.Certificat_Id,
        cert.Type_Certif,
        this.formatDate(cert.Date_Delivrance),
        this.formatDate(cert.Date_Expiration),
        cert.Imo,
        cert.Status
      ]),
      startY: 30
    });
    doc.save('certificates_report.pdf');
  }

  async downloadCertificatePDF(cert: Certificate): Promise<void> {
    const doc = new jsPDF();
    const ship = this.ships.find(s => s.Imo === cert.Imo);
    const logoUrl = 'assets/logo.png';
    const signatureUrl = 'assets/signature.png';
    const verificationUrl = `http://yourapp/verify/certificat/${cert.Certificat_Id}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
    
    doc.addImage(logoUrl, 'PNG', 20, 10, 50, 20);
    
    doc.setFontSize(16);
    doc.text('Maritime Certificate', 105, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Certificate ID: ${cert.Certificat_Id}`, 20, 60);
    doc.text(`Type: ${cert.Type_Certif}`, 20, 70);
    doc.text(`Ship: ${ship?.Nom_Navire || 'Unknown'} (IMO: ${cert.Imo})`, 20, 80);
    doc.text(`Flag: ${ship?.Flag || 'Unknown'}`, 20, 90);
    doc.text(`Issue Date: ${this.formatDate(cert.Date_Delivrance)}`, 20, 100);
    doc.text(`Expiry Date: ${this.formatDate(cert.Date_Expiration)}`, 20, 110);
    doc.text(`Status: ${cert.Status}`, 20, 120);
    
    doc.addImage(qrCodeDataUrl, 'PNG', 150, 60, 30, 30);
    
    doc.text('Authorized by Maritime Authority', 20, 150);
    doc.addImage(signatureUrl, 'PNG', 20, 160, 50, 20);
    
    doc.save(`certificate_${cert.Certificat_Id}.pdf`);
  }

  printInspections(): void {
    const doc = new jsPDF();
    doc.text('Inspections Report', 20, 20);
    autoTable(doc, {
      head: [['ID', 'Type', 'Date', 'Due Date', 'Result', 'Ship IMO']],
      body: this.filteredInspections.map(insp => [
        insp.Inspection_Id,
        insp.Type,
        this.formatDate(insp.Date_Visite),
        this.formatDate(insp.Due_Date),
        insp.Resultat,
        insp.Imo
      ]),
      startY: 30
    });
    doc.save('inspections_report.pdf');
  }

  printOwners(): void {
    const doc = new jsPDF();
    doc.text('Ship Owners Report', 20, 20);
    autoTable(doc, {
      head: [['ID', 'Name', 'Contact']],
      body: this.filteredOwners.map(owner => [
        owner.Armateur_Id,
        owner.Nom_Armateur,
        owner.Contact
      ]),
      startY: 30
    });
    doc.save('owners_report.pdf');
  }

  private formatDate(date: Date): string {
    return new DatePipe('en-US').transform(date, 'yyyy-MM-dd') || '';
  }

  getCertificateStatusClass(cert: Certificate): string {
    if (cert.Status === 'Expired' || cert.Date_Expiration < this.now) return 'Expired';
    return cert.Status;
  }

  cancelCertificate(cert: Certificate) {
    if (confirm('Cancel this certificate?')) {
      this.updateCertificateStatus(cert, 'Cancelled');
    }
  }

  withdrawCertificate(cert: Certificate) {
    if (confirm('Withdraw this certificate?')) {
      this.updateCertificateStatus(cert, 'Withdrawn');
    }
  }

  reinstateCertificate(cert: Certificate) {
    if (confirm('Reinstate this certificate?')) {
      this.updateCertificateStatus(cert, 'Active');
    }
  }

  private updateCertificateStatus(cert: Certificate, status: 'Active' | 'Cancelled' | 'Withdrawn') {
    const payload = { ...cert, Status: status };
    this.http.put(`${this.apiUrl}/certificats/${cert.Certificat_Id}`, payload).subscribe(
      () => this.fetchCertificates(),
      error => console.error('Error updating status:', error)
    );
  }

  viewCertificate(cert: Certificate) {
    this.selectedCertificate = cert;
    this.showCertificateView = true;
  }

  closeCertificateView() {
    this.showCertificateView = false;
  }

  getInspectionHistory(imo: number): Inspection[] {
    return this.inspections.filter(i => i.Imo === imo).sort((a, b) => b.Date_Visite.getTime() - a.Date_Visite.getTime());
  }

  viewInspection(insp: Inspection) {
    this.selectedInspection = insp;
    this.showInspectionView = true;
  }

  closeInspectionView() {
    this.showInspectionView = false;
  }

  viewOwner(owner: Owner) {
    this.selectedOwner = owner;
    this.showOwnerView = true;
  }

  closeOwnerView() {
    this.showOwnerView = false;
  }

  addNewUser(): void {
    this.isEditMode = false;
    this.userForm = this.getEmptyUserForm();
    this.showUserForm = true;
  }

  editUser(user: User): void {
    this.http.get<any>(`${this.apiUrl}/users/${user.utilisateur_id}`).subscribe(
      (full) => {
        this.isEditMode = true;
        this.userForm = {
          utilisateur_id: full.utilisateur_id,
          nom_utilisateur: full.nom_utilisateur,
          email: full.email,
          role: full.role,
          mot_de_passe: ''
        };
        this.showUserForm = true;
      },
      error => {
        this.isEditMode = true;
        this.userForm = {
          utilisateur_id: user.utilisateur_id,
          nom_utilisateur: user.nom_utilisateur,
          email: user.email,
          role: user.role,
          mot_de_passe: ''
        };
        this.showUserForm = true;
      }
    );
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user ${user.nom_utilisateur}?`)) {
      this.http.delete(`${this.apiUrl}/users/${user.utilisateur_id}`).subscribe(
        () => {
          this.users = this.users.filter(u => u.utilisateur_id !== user.utilisateur_id);
        },
        error => console.error('Error deleting user:', error)
      );
    }
  }

  submitUserForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/users/${this.userForm.utilisateur_id}` : `${this.apiUrl}/users`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    method(url, this.userForm).subscribe(
      () => {
        this.showUserForm = false;
        this.fetchUsers();
      },
      error => console.error('Error submitting user:', error)
    );
  }

  cancelUserForm(): void {
    this.showUserForm = false;
  }

  addNewShip(): void {
    this.isEditMode = false;
    this.shipForm = this.getEmptyShipForm();
    this.showShipForm = true;
    this.loadLookups();
  }

  editShip(ship: Ship): void {
    this.isEditMode = true;
    this.shipForm = {
      Imo: ship.Imo,
      Nom_Navire: ship.Nom_Navire,
      Statut: ship.Statut,
      Type_Navire_Id: ship.Type_Navire_Id,
      Pavillon_Id: ship.Pavillon_Id,
      Armateur_Id: ship.Armateur_Id,
      Port_Id: ship.Port_Id
    };
    this.showShipForm = true;
    this.loadLookups();
  }

  deleteShip(ship: Ship): void {
    if (confirm(`Delete ship ${ship.Nom_Navire}?`)) {
      this.http.delete(`${this.apiUrl}/ships/${ship.Imo}`).subscribe(
        () => {
          this.ships = this.ships.filter(s => s.Imo !== ship.Imo);
        },
        error => console.error('Error deleting ship:', error)
      );
    }
  }

  submitShipForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/ships/${this.shipForm.Imo}` : `${this.apiUrl}/ships`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    method(url, this.shipForm).subscribe(
      () => {
        this.showShipForm = false;
        this.fetchShips();
      },
      error => console.error('Error submitting ship:', error)
    );
  }

  cancelShipForm(): void {
    this.showShipForm = false;
  }

  addNewCertificate(): void {
    this.isEditMode = false;
    this.certificateForm = this.getEmptyCertificateForm();
    this.showCertificateForm = true;
    this.loadLookups();
  }

  editCertificate(cert: Certificate): void {
    this.isEditMode = true;
    this.certificateForm = {
      Certificat_Id: cert.Certificat_Id,
      Type_Certif_Id: this.certificateTypes.find(t => t.Nom === cert.Type_Certif)?.Type_Certif_Id,
      Date_Delivrance: this.formatDate(cert.Date_Delivrance),
      Date_Expiration: this.formatDate(cert.Date_Expiration),
      Imo: cert.Imo,
      Status: cert.Status
    };
    this.showCertificateForm = true;
    this.loadLookups();
  }

  deleteCertificate(cert: Certificate): void {
    if (confirm(`Delete certificate ${cert.Certificat_Id}?`)) {
      this.http.delete(`${this.apiUrl}/certificats/${cert.Certificat_Id}`).subscribe(
        () => {
          this.certificates = this.certificates.filter(c => c.Certificat_Id !== cert.Certificat_Id);
        },
        error => console.error('Error deleting certificate:', error)
      );
    }
  }

  renewCertificate(cert: Certificate): void {
    const newExpiry = new Date(cert.Date_Expiration);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    const payload = {
      ...cert,
      Date_Expiration: newExpiry,
      Revalidations: [...(cert.Revalidations || []), { Date: new Date(), Note: 'Renewed' }]
    };
    this.http.put(`${this.apiUrl}/certificats/${cert.Certificat_Id}`, payload).subscribe(
      () => this.fetchCertificates(),
      error => console.error('Error renewing certificate:', error)
    );
  }

  submitCertificateForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/certificats/${this.certificateForm.Certificat_Id}` : `${this.apiUrl}/certificats`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    const payload = {
      ...this.certificateForm,
      Date_Delivrance: new Date(this.certificateForm.Date_Delivrance),
      Date_Expiration: new Date(this.certificateForm.Date_Expiration)
    };
    method(url, payload).subscribe(
      () => {
        this.showCertificateForm = false;
        this.fetchCertificates();
      },
      error => console.error('Error submitting certificate:', error)
    );
  }

  cancelCertificateForm(): void {
    this.showCertificateForm = false;
  }

  addNewInspection(): void {
    this.isEditMode = false;
    this.inspectionForm = this.getEmptyInspectionForm();
    this.showInspectionForm = true;
    this.loadLookups();
  }

  editInspection(insp: Inspection): void {
    this.isEditMode = true;
    this.inspectionForm = {
      Inspection_Id: insp.Inspection_Id,
      Type: insp.Type,
      Date_Visite: this.formatDate(insp.Date_Visite),
      Due_Date: this.formatDate(insp.Due_Date),
      Resultat: insp.Resultat,
      Observations: insp.Observations,
      Imo: insp.Imo
    };
    this.showInspectionForm = true;
    this.loadLookups();
  }

  deleteInspection(insp: Inspection): void {
    if (confirm(`Delete inspection ${insp.Inspection_Id}?`)) {
      this.http.delete(`${this.apiUrl}/inspections/${insp.Inspection_Id}`).subscribe(
        () => {
          this.inspections = this.inspections.filter(i => i.Inspection_Id !== insp.Inspection_Id);
        },
        error => console.error('Error deleting inspection:', error)
      );
    }
  }

  submitInspectionForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/inspections/${this.inspectionForm.Inspection_Id}` : `${this.apiUrl}/inspections`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    const payload = {
      ...this.inspectionForm,
      Date_Visite: new Date(this.inspectionForm.Date_Visite),
      Due_Date: new Date(this.inspectionForm.Due_Date)
    };
    method(url, payload).subscribe(
      () => {
        this.showInspectionForm = false;
        this.fetchInspections();
      },
      error => console.error('Error submitting inspection:', error)
    );
  }

  cancelInspectionForm(): void {
    this.showInspectionForm = false;
  }

  addNewOwner(): void {
    this.isEditMode = false;
    this.ownerForm = this.getEmptyOwnerForm();
    this.showOwnerForm = true;
  }

  editOwner(owner: Owner): void {
    this.isEditMode = true;
    this.ownerForm = {
      Armateur_Id: owner.Armateur_Id,
      Nom_Armateur: owner.Nom_Armateur,
      Contact: owner.Contact
    };
    this.showOwnerForm = true;
  }

  deleteOwner(owner: Owner): void {
    if (confirm(`Delete owner ${owner.Nom_Armateur}?`)) {
      this.http.delete(`${this.apiUrl}/armateurs/${owner.Armateur_Id}`).subscribe(
        () => {
          this.owners = this.owners.filter(o => o.Armateur_Id !== owner.Armateur_Id);
        },
        error => console.error('Error deleting owner:', error)
      );
    }
  }

  submitOwnerForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/armateurs/${this.ownerForm.Armateur_Id}` : `${this.apiUrl}/armateurs`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    method(url, this.ownerForm).subscribe(
      () => {
        this.showOwnerForm = false;
        this.fetchOwners();
      },
      error => console.error('Error submitting owner:', error)
    );
  }

  cancelOwnerForm(): void {
    this.showOwnerForm = false;
  }

  setActiveCodifTab(tab: 'ports' | 'shipTypes' | 'certificateTypes' | 'flags'): void {
    this.activeCodifTab = tab;
  }

  addNewPort(): void {
    this.isEditMode = false;
    this.portForm = this.getEmptyPortForm();
    this.showPortForm = true;
  }

  editPort(port: PortEntity): void {
    this.isEditMode = true;
    this.portForm = {
      Port_Id: port.Port_Id,
      Nom_Port: port.Nom_Port
    };
    this.showPortForm = true;
  }

  deletePort(port: PortEntity): void {
    if (confirm(`Delete port ${port.Nom_Port}?`)) {
      this.http.delete(`${this.apiUrl}/ports/${port.Port_Id}`).subscribe(
        () => {
          this.ports = this.ports.filter(p => p.Port_Id !== port.Port_Id);
        },
        error => console.error('Error deleting port:', error)
      );
    }
  }

  submitPortForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/ports/${this.portForm.Port_Id}` : `${this.apiUrl}/ports`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    method(url, this.portForm).subscribe(
      () => {
        this.showPortForm = false;
        this.loadLookups();
      },
      error => console.error('Error submitting port:', error)
    );
  }

  cancelPortForm(): void {
    this.showPortForm = false;
  }

  addNewShipType(): void {
    this.isEditMode = false;
    this.shipTypeForm = this.getEmptyShipTypeForm();
    this.showShipTypeForm = true;
  }

  editShipType(type: ShipType): void {
    this.isEditMode = true;
    this.shipTypeForm = {
      Type_Navire_Id: type.Type_Navire_Id,
      Type: type.Type
    };
    this.showShipTypeForm = true;
  }

  deleteShipType(type: ShipType): void {
    if (confirm(`Delete ship type ${type.Type}?`)) {
      this.http.delete(`${this.apiUrl}/typesnavire/${type.Type_Navire_Id}`).subscribe(
        () => {
          this.shipTypes = this.shipTypes.filter(t => t.Type_Navire_Id !== type.Type_Navire_Id);
        },
        error => console.error('Error deleting ship type:', error)
      );
    }
  }

  submitShipTypeForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/typesnavire/${this.shipTypeForm.Type_Navire_Id}` : `${this.apiUrl}/typesnavire`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    method(url, this.shipTypeForm).subscribe(
      () => {
        this.showShipTypeForm = false;
        this.loadLookups();
      },
      error => console.error('Error submitting ship type:', error)
    );
  }

  cancelShipTypeForm(): void {
    this.showShipTypeForm = false;
  }

  addNewCertificateType(): void {
    this.isEditMode = false;
    this.certificateTypeForm = this.getEmptyCertificateTypeForm();
    this.showCertificateTypeForm = true;
  }

  editCertificateType(certType: CertificateType): void {
    this.isEditMode = true;
    this.certificateTypeForm = {
      Type_Certif_Id: certType.Type_Certif_Id,
      Nom: certType.Nom
    };
    this.showCertificateTypeForm = true;
  }

  deleteCertificateType(certType: CertificateType): void {
    if (confirm(`Delete certificate type ${certType.Nom}?`)) {
      this.http.delete(`${this.apiUrl}/typescertif/${certType.Type_Certif_Id}`).subscribe(
        () => {
          this.certificateTypes = this.certificateTypes.filter(t => t.Type_Certif_Id !== certType.Type_Certif_Id);
        },
        error => console.error('Error deleting certificate type:', error)
      );
    }
  }

  submitCertificateTypeForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/typescertif/${this.certificateTypeForm.Type_Certif_Id}` : `${this.apiUrl}/typescertif`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    method(url, this.certificateTypeForm).subscribe(
      () => {
        this.showCertificateTypeForm = false;
        this.loadLookups();
      },
      error => console.error('Error submitting certificate type:', error)
    );
  }

  cancelCertificateTypeForm(): void {
    this.showCertificateTypeForm = false;
  }

  addNewFlag(): void {
    this.isEditMode = false;
    this.flagForm = this.getEmptyFlagForm();
    this.showFlagForm = true;
  }

  editFlag(flag: Flag): void {
    this.isEditMode = true;
    this.flagForm = {
      Pavillon_Id: flag.Pavillon_Id,
      Pays: flag.Pays
    };
    this.showFlagForm = true;
  }

  deleteFlag(flag: Flag): void {
    if (confirm(`Delete flag ${flag.Pays}?`)) {
      this.http.delete(`${this.apiUrl}/pavillons/${flag.Pavillon_Id}`).subscribe(
        () => {
          this.flags = this.flags.filter(f => f.Pavillon_Id !== flag.Pavillon_Id);
        },
        error => console.error('Error deleting flag:', error)
      );
    }
  }

  submitFlagForm(): void {
    const url = this.isEditMode ? `${this.apiUrl}/pavillons/${this.flagForm.Pavillon_Id}` : `${this.apiUrl}/pavillons`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    method(url, this.flagForm).subscribe(
      () => {
        this.showFlagForm = false;
        this.loadLookups();
      },
      error => console.error('Error submitting flag:', error)
    );
  }

  cancelFlagForm(): void {
    this.showFlagForm = false;
  }

  requestCertificate(): void {
    this.isEditMode = false;
    this.certificateRequestForm = this.getEmptyCertificateRequestForm();
    this.showCertificateRequestForm = true;
    this.loadLookups();
  }

  editCertificateRequest(req: CertificateRequest): void {
    this.isEditMode = true;
    this.certificateRequestForm = {
      Request_Id: req.Request_Id,
      Imo: req.Imo,
      Type_Certif_Id: req.Type_Certif_Id,
      Category: req.Category,
      Documents: req.Documents || []
    };
    this.showCertificateRequestForm = true;
    this.loadLookups();
  }

  deleteCertificateRequest(req: CertificateRequest): void {
    if (confirm(`Delete certificate request ${req.Request_Id}?`)) {
      this.http.delete(`${this.apiUrl}/certificate-requests/${req.Request_Id}`).subscribe(
        () => {
          this.certificateRequests = this.certificateRequests.filter(r => r.Request_Id !== req.Request_Id);
        },
        error => console.error('Error deleting certificate request:', error)
      );
    }
  }

  approveCertificateRequest(req: CertificateRequest): void {
    if (confirm(`Approve certificate request ${req.Request_Id}?`)) {
      this.http.put(`${this.apiUrl}/certificate-requests/${req.Request_Id}/approve`, {}).subscribe(
        () => {
          this.fetchCertificateRequests();
          this.fetchCertificates();
        },
        error => console.error('Error approving certificate request:', error)
      );
    }
  }

  rejectCertificateRequest(req: CertificateRequest): void {
    if (confirm(`Reject certificate request ${req.Request_Id}?`)) {
      this.http.put(`${this.apiUrl}/certificate-requests/${req.Request_Id}/reject`, {}).subscribe(
        () => {
          this.fetchCertificateRequests();
        },
        error => console.error('Error rejecting certificate request:', error)
      );
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.certificateRequestForm.Documents = Array.from(input.files);
    }
  }

  submitCertificateRequestForm(): void {
    const formData = new FormData();
    formData.append('Imo', this.certificateRequestForm.Imo.toString());
    formData.append('Type_Certif_Id', this.certificateRequestForm.Type_Certif_Id.toString());
    formData.append('Category', this.certificateRequestForm.Category);
    if (this.certificateRequestForm.Documents) {
      this.certificateRequestForm.Documents.forEach((file: File, index: number) => {
        formData.append(`Documents[${index}]`, file);
      });
    }
    const url = this.isEditMode ? `${this.apiUrl}/certificate-requests/${this.certificateRequestForm.Request_Id}` : `${this.apiUrl}/certificate-requests`;
    const method = this.isEditMode ? this.http.put.bind(this.http) : this.http.post.bind(this.http);
    method(url, formData).subscribe(
      () => {
        this.showCertificateRequestForm = false;
        this.fetchCertificateRequests();
      },
      error => console.error('Error submitting certificate request:', error)
    );
  }

  cancelCertificateRequestForm(): void {
    this.showCertificateRequestForm = false;
  }

  scheduleInspection(): void {
    this.addNewInspection();
  }

  private getEmptyUserForm() {
    return { utilisateur_id: 0, nom_utilisateur: '', email: '', role: '', mot_de_passe: '' };
  }

  private getEmptyShipForm() {
    return { Imo: 0, Nom_Navire: '', Type_Navire_Id: null, Pavillon_Id: null, Statut: '', Armateur_Id: null, Port_Id: null };
  }

  private getEmptyOwnerForm() {
    return { Armateur_Id: 0, Nom_Armateur: '', Contact: '' };
  }

  private getEmptyCertificateForm() {
    return { Certificat_Id: 0, Type_Certif_Id: null, Date_Delivrance: '', Date_Expiration: '', Imo: 0, Status: 'Active' };
  }

  private getEmptyInspectionForm() {
    return { Inspection_Id: 0, Type: '', Date_Visite: '', Due_Date: '', Resultat: '', Observations: '', Imo: 0 };
  }

  private getEmptyPortForm() {
    return { Port_Id: 0, Nom_Port: '' };
  }

  private getEmptyShipTypeForm() {
    return { Type_Navire_Id: 0, Type: '' };
  }

  private getEmptyCertificateTypeForm() {
    return { Type_Certif_Id: 0, Nom: '' };
  }

  private getEmptyFlagForm() {
    return { Pavillon_Id: 0, Pays: '' };
  }

  private getEmptyCertificateRequestForm() {
    return { Request_Id: 0, Imo: 0, Type_Certif_Id: null, Category: '', Documents: [] };
  }
}
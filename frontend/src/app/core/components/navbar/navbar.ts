import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {
  isMenuOpen = false;
  profileMenuAbierto = false;
  modoOscuro = false;
  usuarioLogueado: any = null;
  showScrollTop = false;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.modoOscuro = this.themeService.isDarkMode;
    this.themeService.darkMode$.subscribe(dark => this.modoOscuro = dark);
    
    // Load user from AuthService signal
    this.loadUser();
  }

  private loadUser(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.usuarioLogueado = {
        nombre: user.fullName || user.username || 'Usuario',
        email: user.email,
        avatar: user.avatar || 'assets/images/Default.png'
      };
    }
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleProfileMenu() {
    // Refresh user data each time profile menu is toggled
    this.loadUser();
    this.profileMenuAbierto = !this.profileMenuAbierto;
  }

  toggleModoOscuro() {
    this.themeService.toggleDarkMode();
  }

  logout() {
    this.authService.logout();
    this.usuarioLogueado = null;
    this.themeService.setDarkMode(false);
    this.router.navigate(['/login']);
  }

  get isInicio(): boolean {
    return this.router.url === '/inicio';
  }

  irAInicio() {
    this.router.navigate(['/inicio']);
  }

  irAPerfil() {
    this.router.navigate(['/perfil-usuario']);
  }

  irATienda() {
    this.router.navigate(['/tienda']);
  }

  irASobreNosotros() {
    this.router.navigate(['/sobre-nosotros']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.isMenuOpen = false;
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-section')) {
      this.profileMenuAbierto = false;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.showScrollTop = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

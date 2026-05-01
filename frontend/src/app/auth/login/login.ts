import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  credentials = {
    username: '',
    password: ''
  };
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit(): void {
    console.log('Login attempt started with:', this.credentials.username);
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.isLoading = false;
        
        // Redirigir según permisos
        this.redirectByPermissions();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error full details:', error);
        if (error.status === 0) {
          this.errorMessage = '❌ No se pudo conectar con el servidor. Verifica que el backend esté corriendo en el puerto 3000.';
        } else if (error.status === 401) {
          this.errorMessage = '❌ Credenciales incorrectas. Verifica tu usuario/email y contraseña.';
        } else {
          this.errorMessage = '❌ Error inesperado: ' + (error.error?.message || error.message);
        }
      }
    });
  }

  private redirectByPermissions(): void {
    console.log('🎯 [Login] Ejecutando redirectByPermissions');
    
    const user = this.authService.getCurrentUser();
    const userModules = this.authService.userModules();
    const roleName = user?.role?.name?.toLowerCase() || '';
    
    console.log('👤 [Login] Rol del usuario:', roleName);
    console.log('🔍 [Login] Módulos del usuario:', userModules);
    
    // 1. Prioridad: Si el rol es "usuario", siempre va a inicio
    if (roleName === 'usuario') {
      console.log('✅ [Login] Rol "usuario" detectado. Redirigiendo a /inicio');
      this.router.navigate(['/inicio']);
      return;
    }
    
    // 2. Si es admin o administrador, va a /admin
    if (roleName === 'admin' || roleName === 'administrador') {
      console.log('✅ [Login] Rol administrativo detectado. Redirigiendo a /admin');
      this.router.navigate(['/admin']);
      return;
    }

    // 3. Si es veterinario, redirigir a su perfil o inicio
    if (roleName === 'veterinario') {
      console.log('✅ [Login] Rol "veterinario" detectado. Redirigiendo a /inicio');
      this.router.navigate(['/inicio']);
      return;
    }
    
    // 4. Fallback por módulos si no se detectó por nombre de rol
    const hasAdminAccess = userModules.includes('dashboard') || userModules.includes('panel-admin');
    
    if (hasAdminAccess) {
      this.router.navigate(['/admin']);
    } else if (userModules.includes('inicio')) {
      this.router.navigate(['/inicio']);
    } else if (userModules.length > 0) {
      this.router.navigate([`/${userModules[0]}`]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}

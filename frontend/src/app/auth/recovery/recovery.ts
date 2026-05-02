import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs/operators';
import { RecoveryService } from '../../core/services/recovery.service';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-recovery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recovery.html',
  styleUrl: './recovery.scss'
})
export class Recovery implements OnInit {
  recoveryForm!: FormGroup;
  mode: 'request' | 'reset' | 'change' = 'request';
  
  isLoading = false;
  message = '';
  messageType = ''; // 'success' or 'error'
  solicitudExitosa = false;
  token = '';

  constructor(
    private fb: FormBuilder,
    private recoveryService: RecoveryService,
    private router: Router,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.detectMode();
  }

  private initForm(): void {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.email]],
      nuevaContrasena: ['', [Validators.minLength(6)]],
      confirmarContrasena: ['', []]
    }, { validators: this.passwordMatchValidator });
  }

  private detectMode(): void {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
        this.mode = 'reset';
        this.updateValidators();
      } else if (params['mode'] === 'change') {
        this.mode = 'change';
        this.updateValidators();
      } else {
        this.mode = 'request';
        this.updateValidators();
      }
    });
  }

  private updateValidators(): void {
    const emailControl = this.recoveryForm.get('email');
    const passwordControl = this.recoveryForm.get('nuevaContrasena');
    const confirmControl = this.recoveryForm.get('confirmarContrasena');

    if (this.mode === 'request') {
      emailControl?.setValidators([Validators.required, Validators.email]);
      passwordControl?.clearValidators();
      confirmControl?.clearValidators();
    } else {
      emailControl?.clearValidators();
      passwordControl?.setValidators([Validators.required, Validators.minLength(6)]);
      confirmControl?.setValidators([Validators.required]);
    }
    
    emailControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();
    confirmControl?.updateValueAndValidity();
  }

  private passwordMatchValidator(g: FormGroup) {
    const password = g.get('nuevaContrasena')?.value;
    const confirm = g.get('confirmarContrasena')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  get isResetOrChange(): boolean {
    return this.mode === 'reset' || this.mode === 'change';
  }

  onSubmit(): void {
    if (this.recoveryForm.invalid) {
      if (this.recoveryForm.hasError('mismatch')) {
        this.message = 'Las contraseñas no coinciden';
      } else {
        this.message = 'Por favor, completa los campos correctamente';
      }
      this.messageType = 'error';
      return;
    }

    if (this.mode === 'request') {
      this.handleSolicitarRecuperacion();
    } else if (this.mode === 'reset') {
      this.handleResetPassword();
    } else if (this.mode === 'change') {
      this.handleChangePassword();
    }
  }

  handleSolicitarRecuperacion(): void {
    const email = this.recoveryForm.get('email')?.value;
    this.isLoading = true;
    this.message = '';
    this.solicitudExitosa = false;

    this.recoveryService.solicitarRecuperacion({ email })
      .pipe(
        timeout(15000),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.message = '✅ Se ha enviado un enlace a tu correo electrónico. Por favor, revísalo para continuar.';
          this.messageType = 'success';
          this.solicitudExitosa = true;
        },
        error: (error) => {
          this.message = '❌ Error: ' + (error.error?.message || 'No se pudo procesar la solicitud.');
          this.messageType = 'error';
        }
      });
  }

  handleResetPassword(): void {
    const nuevaContrasena = this.recoveryForm.get('nuevaContrasena')?.value;
    this.isLoading = true;
    this.message = '';

    this.recoveryService.resetPassword({ 
      token: this.token, 
      nuevaContrasena 
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.message = '✅ Contraseña restablecida con éxito. Redirigiendo al login...';
        this.messageType = 'success';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.message = '❌ Error: ' + (error.error?.message || 'Token inválido o expirado');
        this.messageType = 'error';
      }
    });
  }

  handleChangePassword(): void {
    const nuevaContrasena = this.recoveryForm.get('nuevaContrasena')?.value;
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser?.id) {
      this.message = '❌ Error: Sesión no válida. Inicia sesión nuevamente.';
      this.messageType = 'error';
      return;
    }

    this.isLoading = true;
    this.message = '';

    this.usersService.updateUser(currentUser.id, { password: nuevaContrasena }).subscribe({
      next: () => {
        this.isLoading = false;
        this.message = '✅ Contraseña cambiada con éxito.';
        this.messageType = 'success';
        setTimeout(() => this.router.navigate(['/perfil-usuario']), 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.message = '❌ Error: ' + (error.error?.message || 'No se pudo completar la acción');
        this.messageType = 'error';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToProfile(): void {
    this.router.navigate(['/perfil-usuario']);
  }
}

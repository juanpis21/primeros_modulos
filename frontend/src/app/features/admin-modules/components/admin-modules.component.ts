import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { ServiciosService, Servicio } from '../../../core/services/servicios.service';
import { RolesService, Role } from '../../../core/services/roles.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-modules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-modules.component.html',
  styleUrl: './admin-modules.component.scss'
})
export class AdminModulesComponent implements OnInit {
  activeSection: string = 'dashboard';
  sidebarOpen: boolean = true;
  usuarios: any[] = [];
  servicios: Servicio[] = [];
  roles: Role[] = [];
  isLoading: boolean = false;
  showOnlyInactive: boolean = false;

  // Modales Usuarios
  showAddUserModal: boolean = false;
  showEditUserModal: boolean = false;

  newUser: any = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: null
  };

  editingUser: any = {};

  // Modales
  showAddServiceModal: boolean = false;
  showEditServiceModal: boolean = false;

  newService: Partial<Servicio> = {
    nombre: '',
    tipoServicio: '',
    precioBase: 0,
    duracionMinutos: 30,
    requiereCita: true,
    descripcion: '',
    veterinariaId: 1
  };

  editingService: Partial<Servicio> = {};
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  baseUrl: string = 'http://localhost:3000';

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private serviciosService: ServiciosService,
    private rolesService: RolesService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarServicios();
    this.cargarRoles();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  setSection(section: string): void {
    this.activeSection = section;
  }

  cargarUsuarios(): void {
    this.usersService.getUsersByRoles(['usuario', 'veterinario']).subscribe({
      next: (data) => this.usuarios = data,
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  cargarRoles(): void {
    this.rolesService.getRoles().subscribe({
      next: (data) => this.roles = data,
      error: (err) => console.error('Error al cargar roles:', err)
    });
  }

  cargarServicios(): void {
    this.isLoading = true;
    this.serviciosService.getAll().subscribe({
      next: (data) => {
        this.servicios = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar servicios:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredServicios(): Servicio[] {
    if (this.showOnlyInactive) {
      return this.servicios.filter(s => !s.isActive);
    }
    return this.servicios;
  }

  toggleFilter(): void {
    this.showOnlyInactive = !this.showOnlyInactive;
  }

  get filteredUsuarios(): any[] {
    if (!this.usuarios) return [];
    
    return this.usuarios.filter(u => {
      const roleStr = this.getRolesString(u).toLowerCase().trim();
      // Solo incluimos si el rol es exactamente 'usuario' o 'veterinario'
      return roleStr === 'usuario' || roleStr === 'veterinario';
    });
  }

  getRolesString(user: any): string {
    if (!user.role) return 'Usuario';
    if (typeof user.role === 'string') return user.role;
    return user.role.name || 'Usuario';
  }

  // CRUD USUARIOS
  openAddUserModal(): void {
    console.log('Abriendo modal de agregar usuario');
    this.showAddUserModal = true;
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.newUser = { username: '', email: '', password: '', firstName: '', lastName: '', roleId: null };
  }

  guardarUsuario(): void {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) {
      alert('Por favor, completa los campos obligatorios');
      return;
    }

    this.usersService.createUser(this.newUser).subscribe({
      next: () => {
        this.closeAddUserModal();
        this.cargarUsuarios();
        alert('Usuario creado correctamente');
      },
      error: (err) => alert('Error al crear usuario: ' + (err.error?.message || err.message))
    });
  }

  openEditUserModal(user: any): void {
    this.editingUser = { ...user };
    if (user.role) {
      this.editingUser.roleId = user.role.id || user.roleId;
    }
    this.showEditUserModal = true;
  }

  closeEditUserModal(): void {
    this.showEditUserModal = false;
    this.editingUser = {};
  }

  guardarEdicionUsuario(): void {
    if (!this.editingUser.id) return;

    // Limpiar objeto para el backend
    const { id, password, role, pets, createdAt, updatedAt, fullName, ...updateData } = this.editingUser;
    
    // Si la contraseña está vacía, no la enviamos
    if (!this.editingUser.password) {
      delete updateData.password;
    }

    this.usersService.updateUser(this.editingUser.id, updateData).subscribe({
      next: () => {
        this.closeEditUserModal();
        this.cargarUsuarios();
        alert('Usuario actualizado correctamente');
      },
      error: (err) => alert('Error al actualizar usuario: ' + (err.error?.message || err.message))
    });
  }

  toggleEstadoUsuario(user: any): void {
    const nuevoEstado = !user.isActive;
    this.usersService.updateUser(user.id, { isActive: nuevoEstado }).subscribe({
      next: () => this.cargarUsuarios(),
      error: (err) => alert('Error al cambiar estado: ' + (err.error?.message || err.message))
    });
  }

  // CRUD SERVICIOS
  openAddServiceModal(): void {
    this.showAddServiceModal = true;
  }

  closeAddServiceModal(): void {
    this.showAddServiceModal = false;
    this.newService = {
      nombre: '',
      tipoServicio: '',
      precioBase: 0,
      duracionMinutos: 30,
      requiereCita: true,
      descripcion: '',
      veterinariaId: 1
    };
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  guardarServicio(): void {
    if (!this.newService.nombre || !this.newService.tipoServicio || this.newService.precioBase === undefined) {
      alert('Por favor, completa los campos obligatorios');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.newService.nombre || '');
    formData.append('tipoServicio', this.newService.tipoServicio || '');
    formData.append('precioBase', String(this.newService.precioBase || 0));
    formData.append('duracionMinutos', String(this.newService.duracionMinutos || 30));
    formData.append('descripcion', this.newService.descripcion || '');
    formData.append('veterinariaId', String(this.newService.veterinariaId || 1));
    formData.append('requiereCita', String(this.newService.requiereCita || true));
    
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    this.serviciosService.create(formData).subscribe({
      next: () => {
        this.closeAddServiceModal();
        this.cargarServicios();
        alert('Servicio creado correctamente');
      },
      error: (err) => alert('Error al crear servicio: ' + err.message)
    });
  }

  openEditServiceModal(servicio: Servicio): void {
    this.editingService = { ...servicio };
    this.showEditServiceModal = true;
  }

  closeEditServiceModal(): void {
    this.showEditServiceModal = false;
    this.editingService = {};
    this.selectedFile = null;
    this.imagePreview = null;
  }

  guardarEdicionServicio(): void {
    if (!this.editingService.id) return;

    const formData = new FormData();
    formData.append('nombre', this.editingService.nombre || '');
    formData.append('descripcion', this.editingService.descripcion || '');
    formData.append('precioBase', String(this.editingService.precioBase || 0));
    formData.append('duracionMinutos', String(this.editingService.duracionMinutos || 30));
    formData.append('tipoServicio', this.editingService.tipoServicio || '');
    formData.append('requiereCita', String(this.editingService.requiereCita || true));
    formData.append('isActive', String(this.editingService.isActive || true));
    formData.append('veterinariaId', String(this.editingService.veterinariaId || 1));

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    this.serviciosService.update(this.editingService.id, formData).subscribe({
      next: () => {
        this.closeEditServiceModal();
        this.cargarServicios();
        alert('Servicio actualizado correctamente');
      },
      error: (err) => alert('Error al actualizar servicio: ' + err.message)
    });
  }


  toggleEstadoServicio(servicio: Servicio): void {
    const nuevoEstado = !servicio.isActive;
    this.serviciosService.update(servicio.id, { isActive: nuevoEstado }).subscribe({
      next: () => this.cargarServicios(),
      error: (err) => alert('Error al cambiar estado: ' + err.message)
    });
  }
}

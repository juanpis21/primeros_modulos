import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/services/users.service';
import { ServiciosService, Servicio } from '../../../core/services/servicios.service';
import { VeterinariasService, Veterinaria } from '../../../core/services/veterinarias.service';
import { ProductosService, Producto } from '../../../core/services/productos.service';
import { CategoriasService, Categoria } from '../../../core/services/categorias.service';
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
  veterinarias: Veterinaria[] = [];
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  roles: Role[] = [];
  isLoading: boolean = false;
  showOnlyInactive: boolean = false;

  // Configuración Admin
  adminUser: any = {
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    edad: 0,
    direccion: '',
    tipoDocumento: '',
    numDocumento: '',
    imagen: ''
  };
  adminProfilePreview: string | null = null;
  selectedAdminFile: File | null = null;

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

  // Modales Veterinarias
  showAddVeterinariaModal: boolean = false;
  showEditVeterinariaModal: boolean = false;

  // Modales Productos
  showAddProductoModal: boolean = false;
  showEditProductoModal: boolean = false;

  // Modales Categorías
  showAddCategoriaModal: boolean = false;
  showEditCategoriaModal: boolean = false;

  newCategoria: Partial<Categoria> = {
    nombre: '',
    descripcion: '',
    codigo: '',
    color: '#4ade80',
    isActive: true
  };

  editingCategoria: Partial<Categoria> = {};

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

  newVeterinaria: Partial<Veterinaria> = {
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    rut: '',
    descripcion: '',
    isActive: true
  };

  editingVeterinaria: Partial<Veterinaria> = {};

  newProducto: Partial<Producto> = {
    nombre: '',
    descripcion: '',
    codigoBarras: '',
    stockActual: 0,
    stockMinimo: 5,
    precioCompra: 0,
    precioVenta: 0,
    unidadMedida: 'unidades',
    categoriaId: 0,
    veterinariaId: 0,
    isActive: true
  };

  editingProducto: Partial<Producto> = {};

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  baseUrl: string = 'http://localhost:3000';

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private serviciosService: ServiciosService,
    private veterinariasService: VeterinariasService,
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private rolesService: RolesService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarServicios();
    this.cargarVeterinarias();
    this.cargarProductos();
    this.cargarCategorias();
    this.cargarRoles();
    this.loadAdminProfile();
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

  // ========== CRUD VETERINARIAS ==========
  cargarVeterinarias(): void {
    this.veterinariasService.getAll().subscribe({
      next: (data) => this.veterinarias = data,
      error: (err) => console.error('Error al cargar veterinarias:', err)
    });
  }

  openAddVeterinariaModal(): void {
    this.showAddVeterinariaModal = true;
  }

  closeAddVeterinariaModal(): void {
    this.showAddVeterinariaModal = false;
    this.newVeterinaria = {
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      rut: '',
      descripcion: '',
      isActive: true
    };
  }

  guardarVeterinaria(): void {
    if (!this.newVeterinaria.nombre || !this.newVeterinaria.direccion || !this.newVeterinaria.telefono || !this.newVeterinaria.email || !this.newVeterinaria.rut) {
      alert('Por favor, completa los campos obligatorios');
      return;
    }

    this.veterinariasService.create(this.newVeterinaria).subscribe({
      next: () => {
        this.closeAddVeterinariaModal();
        this.cargarVeterinarias();
        alert('Veterinaria registrada correctamente');
      },
      error: (err) => alert('Error al registrar veterinaria: ' + (err.error?.message || err.message))
    });
  }

  openEditVeterinariaModal(vet: Veterinaria): void {
    this.editingVeterinaria = { ...vet };
    this.showEditVeterinariaModal = true;
  }

  closeEditVeterinariaModal(): void {
    this.showEditVeterinariaModal = false;
    this.editingVeterinaria = {};
  }

  guardarEdicionVeterinaria(): void {
    if (!this.editingVeterinaria.id) return;

    const { id, createdAt, updatedAt, ...updateData } = this.editingVeterinaria as any;

    this.veterinariasService.update(this.editingVeterinaria.id, updateData).subscribe({
      next: () => {
        this.closeEditVeterinariaModal();
        this.cargarVeterinarias();
        alert('Veterinaria actualizada correctamente');
      },
      error: (err) => alert('Error al actualizar veterinaria: ' + (err.error?.message || err.message))
    });
  }

  toggleEstadoVeterinaria(vet: Veterinaria): void {
    const nuevoEstado = !vet.isActive;
    this.veterinariasService.update(vet.id, { isActive: nuevoEstado }).subscribe({
      next: () => this.cargarVeterinarias(),
      error: (err) => alert('Error al cambiar estado: ' + (err.error?.message || err.message))
    });
  }

  eliminarVeterinaria(vet: Veterinaria): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la veterinaria "${vet.nombre}"?`)) {
      this.veterinariasService.delete(vet.id).subscribe({
        next: () => {
          this.cargarVeterinarias();
          alert('Veterinaria eliminada correctamente');
        },
        error: (err) => alert('Error al eliminar veterinaria: ' + (err.error?.message || err.message))
      });
    }
  }

  // ========== CRUD PRODUCTOS ==========
  cargarProductos(): void {
    this.productosService.getAll().subscribe({
      next: (data) => this.productos = data,
      error: (err) => console.error('Error al cargar productos:', err)
    });
  }

  cargarCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  openAddProductoModal(): void {
    this.showAddProductoModal = true;
  }

  closeAddProductoModal(): void {
    this.showAddProductoModal = false;
    this.newProducto = {
      nombre: '',
      descripcion: '',
      codigoBarras: '',
      stockActual: 0,
      stockMinimo: 5,
      precioCompra: 0,
      precioVenta: 0,
      unidadMedida: 'unidades',
      categoriaId: 0,
      veterinariaId: 0,
      isActive: true
    };
  }

  guardarProducto(): void {
    if (!this.newProducto.nombre || !this.newProducto.descripcion || !this.newProducto.categoriaId || !this.newProducto.veterinariaId) {
      alert('Por favor, completa los campos obligatorios');
      return;
    }

    // Asegurar que los tipos sean correctos para el DTO del backend
    const payload = {
      ...this.newProducto,
      categoriaId: Number(this.newProducto.categoriaId),
      veterinariaId: Number(this.newProducto.veterinariaId),
      stockActual: Number(this.newProducto.stockActual || 0),
      stockMinimo: Number(this.newProducto.stockMinimo || 0),
      precioCompra: Number(this.newProducto.precioCompra || 0),
      precioVenta: Number(this.newProducto.precioVenta || 0),
    };

    // Limpiar campos opcionales vacíos
    if (!payload.codigoBarras) delete payload.codigoBarras;
    if (!payload.lote) delete payload.lote;
    if (!payload.ubicacion) delete payload.ubicacion;
    if (!payload.fechaVencimiento) delete payload.fechaVencimiento;

    this.productosService.create(payload).subscribe({
      next: () => {
        this.closeAddProductoModal();
        this.cargarProductos();
        alert('Producto registrado correctamente');
      },
      error: (err) => {
        console.error('Error al registrar producto:', err);
        const errorMsg = err.error?.message;
        const detail = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg;
        alert('Error al registrar producto: ' + (detail || err.message));
      }
    });
  }

  openEditProductoModal(prod: Producto): void {
    this.editingProducto = { ...prod };
    this.showEditProductoModal = true;
  }

  closeEditProductoModal(): void {
    this.showEditProductoModal = false;
    this.editingProducto = {};
  }

  guardarEdicionProducto(): void {
    if (!this.editingProducto.id) return;

    // Limpiar objeto y asegurar tipos
    const raw = this.editingProducto as any;
    const updateData = {
      nombre: raw.nombre,
      descripcion: raw.descripcion,
      codigoBarras: raw.codigoBarras,
      stockActual: Number(raw.stockActual),
      stockMinimo: Number(raw.stockMinimo),
      precioCompra: Number(raw.precioCompra),
      precioVenta: Number(raw.precioVenta),
      unidadMedida: raw.unidadMedida,
      lote: raw.lote,
      ubicacion: raw.ubicacion,
      fechaVencimiento: raw.fechaVencimiento,
      categoriaId: Number(raw.categoriaId),
      veterinariaId: Number(raw.veterinariaId),
      isActive: raw.isActive
    };

    // Limpiar opcionales vacíos
    if (!updateData.codigoBarras) delete updateData.codigoBarras;
    if (!updateData.lote) delete updateData.lote;
    if (!updateData.ubicacion) delete updateData.ubicacion;
    if (!updateData.fechaVencimiento) delete updateData.fechaVencimiento;

    this.productosService.update(this.editingProducto.id, updateData).subscribe({
      next: () => {
        this.closeEditProductoModal();
        this.cargarProductos();
        alert('Producto actualizado correctamente');
      },
      error: (err) => {
        console.error('Error al actualizar producto:', err);
        const errorMsg = err.error?.message;
        const detail = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg;
        alert('Error al actualizar producto: ' + (detail || err.message));
      }
    });
  }

  toggleEstadoProducto(prod: Producto): void {
    const nuevoEstado = !prod.isActive;
    this.productosService.update(prod.id, { isActive: nuevoEstado }).subscribe({
      next: () => this.cargarProductos(),
      error: (err) => alert('Error al cambiar estado: ' + (err.error?.message || err.message))
    });
  }

  eliminarProducto(prod: Producto): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el producto "${prod.nombre}"?`)) {
      this.productosService.delete(prod.id).subscribe({
        next: () => {
          this.cargarProductos();
          alert('Producto eliminado correctamente');
        },
        error: (err) => alert('Error al eliminar producto: ' + (err.error?.message || err.message))
      });
    }
  }

  getCategoriaNombre(categoriaId: number): string {
    const cat = this.categorias.find(c => c.id === categoriaId);
    return cat ? cat.nombre : 'Sin categoría';
  }

  getVeterinariaNombre(veterinariaId: number): string {
    const vet = this.veterinarias.find(v => v.id === veterinariaId);
    return vet ? vet.nombre : 'Sin veterinaria';
  }

  isExpired(date: string | undefined): boolean {
    if (!date) return false;
    const expirationDate = new Date(date);
    const today = new Date();
    return expirationDate < today;
  }

  // ========== CRUD CATEGORÍAS ==========
  openAddCategoriaModal(): void {
    this.showAddCategoriaModal = true;
  }

  closeAddCategoriaModal(): void {
    this.showAddCategoriaModal = false;
    this.newCategoria = { nombre: '', descripcion: '', codigo: '', color: '#4ade80', isActive: true };
  }

  guardarCategoria(): void {
    if (!this.newCategoria.nombre || !this.newCategoria.codigo) {
      alert('Por favor, completa los campos obligatorios (Nombre y Código)');
      return;
    }

    this.categoriasService.create(this.newCategoria).subscribe({
      next: () => {
        this.closeAddCategoriaModal();
        this.cargarCategorias();
        alert('Categoría registrada correctamente');
      },
      error: (err) => alert('Error al registrar categoría: ' + (err.error?.message || err.message))
    });
  }

  openEditCategoriaModal(cat: Categoria): void {
    this.editingCategoria = { ...cat };
    this.showEditCategoriaModal = true;
  }

  closeEditCategoriaModal(): void {
    this.showEditCategoriaModal = false;
    this.editingCategoria = {};
  }

  guardarEdicionCategoria(): void {
    if (!this.editingCategoria.id) return;
    const { id, createdAt, updatedAt, ...updateData } = this.editingCategoria as any;

    this.categoriasService.update(this.editingCategoria.id, updateData).subscribe({
      next: () => {
        this.closeEditCategoriaModal();
        this.cargarCategorias();
        alert('Categoría actualizada correctamente');
      },
      error: (err) => alert('Error al actualizar categoría: ' + (err.error?.message || err.message))
    });
  }

  toggleEstadoCategoria(cat: Categoria): void {
    const nuevoEstado = !cat.isActive;
    this.categoriasService.update(cat.id, { isActive: nuevoEstado }).subscribe({
      next: () => this.cargarCategorias(),
      error: (err) => alert('Error al cambiar estado: ' + (err.error?.message || err.message))
    });
  }

  eliminarCategoria(cat: Categoria): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${cat.nombre}"?`)) {
      this.categoriasService.delete(cat.id).subscribe({
        next: () => {
          this.cargarCategorias();
          alert('Categoría eliminada correctamente');
        },
        error: (err) => alert('Error al eliminar categoría: ' + (err.error?.message || err.message))
      });
    }
  }

  // CONFIGURACIÓN ADMIN
  loadAdminProfile(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      const avatar = currentUser.avatar || '';
      this.adminUser = {
        id: currentUser.id,
        nombres: currentUser.firstName || '',
        apellidos: currentUser.lastName || '',
        correo: currentUser.email || '',
        telefono: currentUser.phone || '',
        edad: currentUser.age || 0,
        direccion: currentUser.address || '',
        tipoDocumento: currentUser.documentType || '',
        numDocumento: currentUser.documentNumber || '',
        imagen: avatar && avatar.startsWith('/uploads/') ? `${this.baseUrl}${avatar}` : avatar,
        roleId: currentUser.roleId
      };
    }
  }

  onAdminProfileImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedAdminFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.adminProfilePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarPerfilAdmin(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      alert('❌ No hay usuario autenticado');
      return;
    }

    const formData = new FormData();
    formData.append('fullName', `${this.adminUser.nombres} ${this.adminUser.apellidos}`.trim());
    formData.append('firstName', this.adminUser.nombres);
    formData.append('lastName', this.adminUser.apellidos);
    formData.append('email', this.adminUser.correo);
    formData.append('phone', this.adminUser.telefono || '');
    formData.append('age', String(this.adminUser.edad || ''));
    formData.append('address', this.adminUser.direccion || '');
    formData.append('documentType', this.adminUser.tipoDocumento || '');
    formData.append('documentNumber', this.adminUser.numDocumento || '');
    
    if (this.selectedAdminFile) {
      formData.append('avatar', this.selectedAdminFile, this.selectedAdminFile.name);
    }

    this.usersService.updateUser(currentUser.id, formData).subscribe({
      next: (response) => {
        this.authService.updateCurrentUser(response);
        this.selectedAdminFile = null;
        this.loadAdminProfile();
        alert('✅ Perfil actualizado correctamente');
      },
      error: (error) => {
        alert('❌ Error al actualizar el perfil: ' + (error.error?.message || 'Error desconocido'));
        console.error('Update profile error:', error);
      }
    });
  }

  getAdminRoleName(): string {
    const roleMap: { [key: number]: string } = {
      1: 'Administrador',
      2: 'Super Administrador',
      3: 'Veterinario',
      4: 'Usuario'
    };
    return roleMap[this.adminUser.roleId || 1] || 'Administrador';
  }

  cambiarContrasena(): void {
    alert('Funcionalidad de cambio de contraseña próximamente disponible.');
  }

  eliminarCuentaAdmin(): void {
    if (confirm('¿Estás seguro de que deseas desactivar tu cuenta de administrador?')) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.usersService.deleteUser(currentUser.id).subscribe({
          next: () => {
            alert('Cuenta desactivada exitosamente.');
            this.logout();
          },
          error: (err) => alert('Error al desactivar cuenta: ' + (err.error?.message || err.message))
        });
      }
    }
  }
}

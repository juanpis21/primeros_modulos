import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { VeterinariasService } from '../../../core/services/veterinarias.service';
import { ProductosService } from '../../../core/services/productos.service';
import { CategoriasService } from '../../../core/services/categorias.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tienda.html',
  styleUrl: './tienda.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Tienda implements OnInit, OnDestroy {
  // Control de vistas: 'tiendas' | 'productos'
  vista: string = 'tiendas';

  // Modo oscuro
  modoOscuro: boolean = false;
  private themeSub!: Subscription;

  // Perfil
  profileMenuAbierto: boolean = false;
  currentUser: any = null;

  // Datos
  // Datos reales
  tiendas: any[] = [];
  tiendaSeleccionada: any = null;
  productos: any[] = [];
  carrito: any[] = [];

  // Filtros
  categorias: any[] = [];
  filtroCategoria: string = 'all';
  filtroOrden: string = 'featured';

  // Carrusel
  slideActual: number = 0;

  // Carrito
  carritoVisible: boolean = false;

  constructor(
    private http: HttpClient, 
    private themeService: ThemeService, 
    private authService: AuthService,
    private veterinariasService: VeterinariasService,
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private router: Router
  ) {}

  // Intervalo para el carrusel
  private carouselInterval: any;

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarTiendas();
    this.cargarCategorias();

    // Sincronizar modo oscuro con ThemeService
    this.themeSub = this.themeService.darkMode$.subscribe(isDark => {
      this.modoOscuro = isDark;
    });
  }

  ngOnDestroy(): void {
    // Limpiar intervalo al destruir el componente
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }

  // Cargar usuario actual
  private cargarUsuario(): void {
    const userData = localStorage.getItem('current_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  // ===== FUNCIONES DE TIENDAS =====
  cargarTiendas(): void {
    this.veterinariasService.getAll().subscribe({
      next: (tiendas) => {
        this.tiendas = tiendas.map(t => ({
          ...t,
          horario: 'Lun-Sáb: 8:00 AM - 7:00 PM', // Placeholder
          estado: t.isActive ? 'Activo' : 'Cerrado'
        }));
      },
      error: (error) => console.error('❌ Error al cargar tiendas:', error)
    });
  }

  seleccionarTienda(tienda: any): void {
    this.tiendaSeleccionada = tienda;
    this.cargarProductosTienda(tienda.id);

    // Cambiar a vista de productos
    this.vista = 'productos';

    // Iniciar carrusel automático al entrar a productos
    this.iniciarCarrusel();

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverATiendas(): void {
    this.vista = 'tiendas';
    this.tiendaSeleccionada = null;
    this.productos = [];

    // Detener carrusel al volver a tiendas
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('🔙 Volviendo a la selección de tiendas');
  }

  cargarCategorias(): void {
    this.categoriasService.getAll().subscribe({
      next: (data) => this.categorias = data,
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  // ===== FUNCIONES DE PRODUCTOS =====
  cargarProductosTienda(tiendaId: number): void {
    this.productosService.getAll().subscribe({
      next: (allProducts) => {
        this.productos = allProducts
          .filter(p => p.veterinariaId === tiendaId && p.isActive)
          .map(p => {
            const cat = this.categorias.find(c => c.id === p.categoriaId);
            return {
              id: p.id,
              nombre: p.nombre,
              descripcion: p.descripcion,
              precio: p.precioVenta,
              categoria: cat ? cat.nombre : 'General',
              categoriaId: p.categoriaId,
              imagen: 'assets/IMG/default.png'
            };
          });
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
        this.productos = [];
      }
    });
  }

  get filteredProducts(): any[] {
    let filtered = [...this.productos];

    if (this.filtroCategoria !== 'all') {
      filtered = filtered.filter(p => p.categoria === this.filtroCategoria);
    }

    if (this.filtroOrden === 'price-low') {
      filtered.sort((a, b) => a.precio - b.precio);
    } else if (this.filtroOrden === 'price-high') {
      filtered.sort((a, b) => b.precio - a.precio);
    } else if (this.filtroOrden === 'name') {
      filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    return filtered;
  }

  // ===== FUNCIONES DE CARRITO =====
  agregarAlCarrito(producto: any): void {
    const existente = this.carrito.find(item => item.id === producto.id);

    if (existente) {
      existente.quantity++;
    } else {
      this.carrito.push({ ...producto, quantity: 1 });
    }

    console.log('🛒 Producto agregado:', producto);
  }

  eliminarDelCarrito(productId: number): void {
    this.carrito = this.carrito.filter(item => item.id !== productId);
  }

  actualizarCantidad(productId: number, cambio: number): void {
    const item = this.carrito.find(i => i.id === productId);
    if (item) {
      item.quantity += cambio;
      if (item.quantity <= 0) {
        this.eliminarDelCarrito(productId);
      }
    }
  }

  obtenerTotal(): number {
    return this.carrito.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  }

  toggleCarrito(): void {
    this.carritoVisible = !this.carritoVisible;
  }

  // ===== CHECKOUT =====
  procederPago(): void {
    if (this.carrito.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    // Guardar en localStorage para la pasarela de pagos
    localStorage.setItem('checkoutCart', JSON.stringify(this.carrito));

    // Redirigir a pasarela de pagos
    this.router.navigate(['/pasarela-pagos']);
  }

  // ===== CARRUSEL =====
  iniciarCarrusel(): void {
    // Limpiar intervalo existente si hay uno
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }

    this.carouselInterval = setInterval(() => {
      this.siguienteSlide();
    }, 5000); // Cambiar slide cada 5 segundos
  }

  siguienteSlide(): void {
    this.slideActual = (this.slideActual + 1) % 3;
  }

  anteriorSlide(): void {
    this.slideActual = (this.slideActual - 1 + 3) % 3;
  }

  // ===== MODO OSCURO =====
  toggleModoOscuro(): void {
    this.themeService.toggleDarkMode();
  }

  irASlide(index: number): void {
    this.slideActual = index;
    // Reiniciar el auto-play al cambiar manualmente
    this.iniciarCarrusel();
  }

  // ===== FILTROS =====
  aplicarFiltros(): void {
    // Lógica de filtrado se implementaría aquí
    console.log('Filtros aplicados:', this.filtroCategoria, this.filtroOrden);
  }

  // ===== PERFIL =====
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Formatear precio
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }
}

import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoteService } from '../../services/lote';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FooterComponent } from "../footer/footer.component";
import { ScrollTopComponent } from "../scroll-top/scroll-top.component";

@Component({
  selector: 'app-home-lote',
  templateUrl: './home-lote.html',
  styleUrls: ['./home-lote.css'],
  imports: [CommonModule, FooterComponent, ScrollTopComponent],
  standalone: true
})
export class HomeLoteComponent implements OnInit {
  whatsappNumber = '4681327809';

  showBtnTop: boolean = false;
  showBtnDown: boolean = true;
  
  lotes: any[] = [];
  lotesFiltered: any[] = [];
  lotesNuevos: any[] = [];
  loteSeleccionado: any = null;
  mostrarModal = false;
  activeFilter = '';
  mapaURL: SafeResourceUrl | null = null;


  constructor(private loteService: LoteService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.cargarLotes();
    this.cargarLotesNuevo();

  }

  cargarLotes() {
    this.loteService.getAll().subscribe({
      next: (data) => {
        this.lotes = data;
        this.lotesFiltered = [...data];
        this.lotesNuevos = data.slice(0, 2);
      },
      error: (err) => {
        console.error('Error al cargar lotes:', err);
      }
    });
  }

  filterType(tipo: string) {
    this.activeFilter = tipo;
    this.lotesFiltered = tipo ? this.lotes.filter(l => l.tipo === tipo) : [...this.lotes];
  }

  verDetalles(lote: any) {
  this.loteSeleccionado = lote;
  this.mostrarModal = true;
  document.body.style.overflow = 'hidden'; // evita que se desplace el fondo
  this.generarMapaURL(lote);
}

  cerrarModal() {
    this.mostrarModal = false;
    this.loteSeleccionado = null;
    document.body.style.overflow = 'auto';
  }

  contactarWhatsApp(lote: any) {
    const mensaje = `Hola, estoy interesado en el lote: ${lote.nombre || lote.tipo} - ${lote.precio}`;
    const url = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  preventClose(event: Event) {
    event.stopPropagation();
  }

  
  generarMapaURL(lote: any): void {
    if (!lote) return;
    const ubicacion = `${lote.direccion}, ${lote.colonia_nombre}, ${lote.ciudad_nombre}, ${lote.estado_nombre}`;
    const query = encodeURIComponent(ubicacion);
    const url = `https://www.google.com/maps?q=${query}&output=embed`;
    this.mapaURL = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  abrirEnGoogleMaps(lote: any) {
  const ubicacion = `${lote.direccion}, ${lote.colonia_nombre}, ${lote.ciudad_nombre}, ${lote.estado_nombre}`;
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ubicacion)}`;
  window.open(url, '_blank');
}

cargarLotesNuevo() {
  this.loteService.getAll().subscribe({
    next: (data) => {
      // Ordena los lotes por fecha (los más nuevos primero)
      this.lotes = data.sort((a, b) => {
        const fechaA = new Date(a.fecha_registro || a.createdAt || 0).getTime();
        const fechaB = new Date(b.fecha_registro || b.createdAt || 0).getTime();
        return fechaB - fechaA; // descendente
      });

      // Guarda también la lista filtrada general
      this.lotesFiltered = [...this.lotes];

      // Toma los 3 más nuevos, por ejemplo
      this.lotesNuevos = this.lotes.slice(0, 3);
    },
    error: (err) => {
      console.error('Error al cargar lotes:', err);
    }
  });
}


  truncateText(text: string, length: number): string {
    if (!text) return '';
    return text.length <= length ? text : text.substring(0, length) + '...';
  }

  // === Scroll Buttons unificados ===
  @HostListener('window:scroll', [])
onWindowScroll() {
  const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  // Mostrar botón subir si scroll > 200
  this.showBtnTop = scrollPos > 200;
  // Mostrar botón bajar si scroll < altura total - 100
  this.showBtnDown = scrollPos < docHeight - 100;
}

// Función unificada para el botón
scrollToggle(): void {
  if (window.pageYOffset > 200) {
    // Si está abajo, subir
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Si está arriba, bajar
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
  actualizarNavbarActivo() {
    const sections = ['inicio', 'lotes', 'nuevos', 'contacto'];
    const navLinks = document.querySelectorAll('.nav-link');

    let currentSection = '';
    sections.forEach(section => {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          currentSection = section;
        }
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }
}

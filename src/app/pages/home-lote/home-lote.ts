import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-lote',
  templateUrl: './home-lote.html',
  styleUrls: ['./home-lote.css'],
  imports: [CommonModule]
})
export class HomeLoteComponent {
  whatsappNumber = '1234567890';
  showScrollButton = false;
  
  // Datos de ejemplo para los lotes
  lotes = [
    {
      id: 1,
      nombre: 'Lote Residencial Vista Hermosa',
      tipo: 'plano',
      descripcion: 'Amplio lote residencial con vista panorámica, ubicado en zona privilegiada con todos los servicios. Ideal para construcción de vivienda familiar con amplios espacios verdes y cercanía a centros educativos.',
      foto: 'assets/lote1.jpg',
      precio: '$150,000',
      ubicacion: 'Zona Norte, Ciudad',
      dimensiones: '15x30 metros',
      servicios: 'Agua, Luz, Drenaje',
      caracteristicas: ['Acceso pavimentado', 'Cerca de centros comerciales', 'Zona segura', 'Vista panorámica', 'Topografía plana']
    },
    {
      id: 2,
      nombre: 'Lote Comercial Centro',
      tipo: 'premium',
      descripcion: 'Excelente oportunidad de inversión en zona comercial de alto tráfico. Perfecto para desarrollo comercial o edificio de oficinas con alto potencial de retorno de inversión.',
      foto: 'assets/lote2.jpg',
      precio: '$250,000',
      ubicacion: 'Centro, Ciudad',
      dimensiones: '20x25 metros',
      servicios: 'Agua, Luz, Drenaje, Gas, Fibra óptica',
      caracteristicas: ['Frente amplio', 'Apto para edificio', 'Zona de alto valorización', 'Estacionamiento propio', 'Fachada comercial']
    },
    {
      id: 3,
      nombre: 'Lote Irregular Valle Verde',
      tipo: 'irregular',
      descripcion: 'Lote con forma irregular ideal para diseño arquitectónico único y creativo. Ubicado en zona en desarrollo con proyección de crecimiento a mediano plazo.',
      foto: 'assets/lote3.jpg',
      precio: '$120,000',
      ubicacion: 'Valle Verde, Ciudad',
      dimensiones: 'Forma irregular - 450m²',
      servicios: 'Agua, Luz',
      caracteristicas: ['Vista a áreas verdes', 'Potencial creativo', 'Precio competitivo', 'Zona tranquila', 'Amplios jardines']
    }
  ];

  lotesFiltered = [...this.lotes];
  lotesNuevos = [...this.lotes.slice(0, 2)];
  loteSeleccionado: any = null;
  mostrarModal = false;
  activeFilter = '';

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollButton = window.pageYOffset > 300;
    this.actualizarNavbarActivo();
  }

  // Actualizar navbar activo basado en scroll
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

  // Filtrar lotes por tipo
  filterType(tipo: string) {
    this.activeFilter = tipo;
    if (tipo === '') {
      this.lotesFiltered = [...this.lotes];
    } else {
      this.lotesFiltered = this.lotes.filter(lote => lote.tipo === tipo);
    }
  }

  // Ver detalles del lote
  verDetalles(lote: any) {
    this.loteSeleccionado = lote;
    this.mostrarModal = true;
    document.body.style.overflow = 'hidden';
  }

  // Cerrar modal de detalles
  cerrarModal() {
    this.mostrarModal = false;
    this.loteSeleccionado = null;
    document.body.style.overflow = 'auto';
  }

  // Contactar por WhatsApp
  contactarWhatsApp(lote: any) {
    const mensaje = `Hola, estoy interesado en el lote: ${lote.nombre} - ${lote.precio}`;
    const url = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  // Prevenir cierre del modal al hacer clic en el contenido
  preventClose(event: Event) {
    event.stopPropagation();
  }

  // Desplazarse al inicio de la página
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Método personalizado para cortar texto
  truncateText(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
}
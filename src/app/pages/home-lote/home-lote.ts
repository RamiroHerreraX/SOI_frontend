import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-lote',
  imports: [CommonModule],
  templateUrl: './home-lote.html',
  styleUrl: './home-lote.css'
})
export class HomeLote implements OnInit {

  whatsappNumber = '1234567890'; // tu número con lada internacional sin signos

  lotes = [
    { nombre: 'Lote A', tipo: 'plano', descripcion: 'Lote plano ideal para construcción...', foto: 'assets/lote1.jpg' },
    { nombre: 'Lote B', tipo: 'irregular', descripcion: 'Lote irregular con terreno amplio...', foto: 'assets/lote2.jpg' },
    { nombre: 'Lote C', tipo: 'premium', descripcion: 'Lote premium con vistas increíbles...', foto: 'assets/lote3.jpg' }
  ];

  lotesNuevos = [
    { nombre: 'Lote D', descripcion: 'Nuevo lote disponible', foto: 'assets/lote4.jpg' },
    { nombre: 'Lote E', descripcion: 'Nuevo lote premium', foto: 'assets/lote5.jpg' }
  ];

  lotesFiltered = [...this.lotes];

  constructor() { }

  ngOnInit(): void { }

  filterType(tipo: string) {
    if (!tipo) {
      this.lotesFiltered = [...this.lotes];
    } else {
      this.lotesFiltered = this.lotes.filter(l => l.tipo === tipo);
    }
  }

  verDetalles(lote: any) {
    alert(`Detalles del lote: ${lote.nombre}\n${lote.descripcion}`);
  }

  scrollToTop() {
    window.scroll({ top: 0, behavior: 'smooth' });
  }
}

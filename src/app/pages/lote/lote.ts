import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoteService } from '../../services/lote';

declare var bootstrap: any;

@Component({
  selector: 'app-lote',
  standalone: true, // ✅ Obligatorio para usar imports
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './lote.html',
  styleUrls: ['./lote.css']
})
export class Lote implements OnInit {

  lotes: any[] = [];
  currentLote: any = {};
  isEdit: boolean = false;

  constructor(private loteService: LoteService) { }

  ngOnInit(): void {
    this.loadLotes();
  }

  // Cargar todos los lotes
  loadLotes(): void {
    this.loteService.getAll().subscribe({
      next: data => this.lotes = data,
      error: err => console.error('Error al cargar lotes', err)
    });
  }

  // Abrir formulario para nuevo lote
  openForm(): void {
    this.isEdit = false;
    this.currentLote = {};
    const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
    modal.show();
  }

  // Editar lote existente
  editLote(lote: any): void {
    this.isEdit = true;
    this.currentLote = { ...lote };
    const modal = new bootstrap.Modal(document.getElementById('loteModal')!);
    modal.show();
  }

  // Guardar lote (crear o actualizar)
  saveLote(): void {
    if (this.isEdit) {
      this.loteService.update(this.currentLote.id_propiedad, this.currentLote)
        .subscribe({
          next: () => {
            this.loadLotes();
            bootstrap.Modal.getInstance(document.getElementById('loteModal')!)?.hide();
          },
          error: err => console.error('Error al actualizar lote', err)
        });
    } else {
      this.loteService.create(this.currentLote)
        .subscribe({
          next: () => {
            this.loadLotes();
            bootstrap.Modal.getInstance(document.getElementById('loteModal')!)?.hide();
          },
          error: err => console.error('Error al crear lote', err)
        });
    }
  }

  // Eliminar lote
  deleteLote(id: number): void {
    if (confirm('¿Seguro que quieres eliminar este lote?')) {
      this.loteService.delete(id)
        .subscribe({
          next: () => this.loadLotes(),
          error: err => console.error('Error al eliminar lote', err)
        });
    }
  }

  // Scroll hacia arriba
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

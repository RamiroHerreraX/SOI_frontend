import { Component } from '@angular/core';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";
import { FooterAdmin } from "../../shared/footer-admin/footer-admin";
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ContratoService } from '../../services/contrato.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-contratos',
  imports: [HeaderAdmin, FooterAdmin, CommonModule, RouterModule],
  templateUrl: './contratos.html',
  styleUrl: './contratos.css'
})
export class Contratos {
  contratos: any[] = [];
  cargando = true;

  constructor(private contratoService: ContratoService) {}

  ngOnInit(): void {
    this.cargarContratos();
  }

  cargarContratos() {
    this.cargando = true;

    this.contratoService.obtenerContratos().subscribe({
      next: (data: any) => {
        this.contratos = data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar los contratos', 'error');
      }
    });
  }

  verDetalles(contrato: any) {
    Swal.fire({
      title: 'Información del Contrato',
      html: `
        <b>ID Contrato:</b> ${contrato.id_contrato} <br>
        <b>Cliente:</b> ${contrato.cliente_nombre} <br>
        <b>Lote:</b> ${contrato.id_lote} <br>
        <b>Precio Total:</b> $${contrato.precio_total} MXN<br>
        <b>Fecha:</b> ${contrato.fecha_creacion}
      `,
      icon: 'info'
    });
  }

  descargarPDF(contrato: any) {
    Swal.fire('PDF', 'Aquí llamarías tu función para generar el PDF nuevamente.', 'info');
  }
}

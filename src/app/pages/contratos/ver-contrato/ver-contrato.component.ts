import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HeaderAdmin } from '../../../shared/header-admin/header-admin';
import { FooterAdmin } from '../../../shared/footer-admin/footer-admin';
import Swal from 'sweetalert2';
import { ContratoService } from '../../../services/contrato.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ver-contrato',
  standalone: true,
  imports: [
    CommonModule,
    HeaderAdmin,
    FooterAdmin,
    FormsModule,
    RouterModule],
  templateUrl: './ver-contrato.component.html',
  styleUrl: './ver-contrato.component.css'
})
export class VerContratoComponent implements OnInit {
  contratos: any[] = [];
  cargando = true;
  contratosFiltrados: any[] = [];
  busqueda: string = "";

  constructor(private contratoService: ContratoService) {}

  ngOnInit(): void {
    this.cargarContratos();
  }

  cargarContratos() {
    this.cargando = true;

    this.contratoService.obtenerContratos().subscribe({
      next: (data: any) => {
        this.contratos = data;
        this.contratosFiltrados = data; 
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar los contratos', 'error');
      }
    });
  }

  filtrarContratos() {
  const texto = this.busqueda.toLowerCase().trim();

  this.contratosFiltrados = this.contratos.filter(c => {
    const nombreCompleto = `${c.cliente_nombre} ${c.apellido_paterno} ${c.apellido_materno}`.toLowerCase();
    return nombreCompleto.includes(texto);
  });
}


  verDetalles(contrato: any) {
    Swal.fire({
      title: 'Información del Contrato',
      html: `
        <b>Cliente:</b> ${contrato.cliente_nombre} ${contrato.apellido_paterno} ${contrato.apellido_materno} <br>
        <b>Correo:</b> ${contrato.correo} <br>
        <b>Telefono:</b> ${contrato.telefono} <br>
        <b>Folio del Lote:</b> ${contrato.id_lote} <br>
        <b>Precio Total:</b> $${contrato.precio_total} MXN<br>
        <b>Propietario: </b> ${contrato.propietario_nombre}<br>
        <b>Fecha:</b> ${ new Date(contrato.fecha_contrato).toLocaleDateString() }
      `,
      icon: 'info'
    });
  }

  descargarPDF(contrato: any) {
    Swal.fire('PDF', 'Aquí llamarías tu función para generar el PDF nuevamente.', 'info');
  }

}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagosService } from '../../services/pagos.service';
import { HeaderAdmin } from '../../shared/header-admin/header-admin';
import { FooterAdmin } from '../../shared/footer-admin/footer-admin';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderAdmin,
    FooterAdmin
  ],
  templateUrl: './pagos.html',
  styleUrls: ['./pagos.css']
})
export class PagosComponent implements OnInit {

  resumen: any[] = [];
  pagosContrato: any[] = [];
  detalleContrato: any = null;
  
  showModalPagos: boolean = false;
  showModalNuevoPago: boolean = false;
  contratoSeleccionado: number = 0;
  
  nuevoPago = {
    id_contrato: 0,
    monto: 0,
    metodo_pago: 'efectivo',
    descripcion: ''
  };

  constructor(private pagosService: PagosService) {}

  ngOnInit() {
    this.cargarResumen();
  }

  cargarResumen() {
    this.pagosService.getResumen().subscribe(
      (res: any) => this.resumen = res,
      (error) => {
        console.error('Error cargando resumen:', error);
        alert('Error al cargar el resumen de pagos');
      }
    );
  }

  verPagos(contrato: any) {
    this.contratoSeleccionado = contrato.id_contrato;
    this.nuevoPago.id_contrato = contrato.id_contrato;
    
    this.pagosService.getDetalleContrato(contrato.id_contrato).subscribe(
      (detalle: any) => {
        this.detalleContrato = detalle;
        this.showModalPagos = true;
        
        this.pagosService.getPagosByContrato(contrato.id_contrato).subscribe(
          (pagos: any) => {
            this.pagosContrato = pagos;
          },
          (error) => {
            console.error('Error cargando pagos:', error);
            this.pagosContrato = [];
          }
        );
      },
      (error) => {
        console.error('Error cargando detalle:', error);
        alert('Error al cargar el detalle del contrato');
      }
    );
  }

  registrarPago() {
    if (this.nuevoPago.monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    if (!this.nuevoPago.metodo_pago) {
      alert('Seleccione un método de pago');
      return;
    }

    this.pagosService.registrarPago(this.nuevoPago).subscribe(
      (respuesta: any) => {
        alert('Pago registrado exitosamente');
        this.showModalNuevoPago = false;
        this.verPagos({ id_contrato: this.contratoSeleccionado });
        this.cargarResumen();
        this.resetNuevoPago();
      },
      error => {
        alert('Error al registrar el pago: ' + (error.error?.error || error.message));
      }
    );
  }

  descargarRecibo(pagoId: number) {
    this.pagosService.descargarRecibo(pagoId).subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo_pago_${pagoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error => {
        alert('Error al generar el recibo: ' + (error.error?.error || error.message));
      }
    );
  }

  enviarNotificacionPago() {
    if (!this.contratoSeleccionado) {
      alert('No hay contrato seleccionado');
      return;
    }

    if (!this.detalleContrato) {
      alert('No hay información del contrato disponible');
      return;
    }

    if (this.detalleContrato.saldo_pendiente <= 0) {
      alert('El cliente no tiene saldo pendiente');
      return;
    }

    const confirmar = confirm(
      `¿Enviar recordatorio de pago a ${this.detalleContrato.nombre} ${this.detalleContrato.apellido_paterno}?\n\n` +
      `Contrato: ${this.contratoSeleccionado}\n` +
      `Saldo pendiente: $${this.detalleContrato.saldo_pendiente.toLocaleString()}`
    );

    if (confirmar) {
      this.pagosService.enviarNotificacionPago(this.contratoSeleccionado).subscribe(
        (respuesta: any) => {
          alert(
            `✅ Notificación enviada exitosamente\n\n` +
            `Cliente: ${respuesta.cliente}\n` +
            `Correo: ${respuesta.correo}\n` +
            `Mensaje: ${respuesta.message}`
          );
        },
        error => {
          alert('❌ Error al enviar la notificación: ' + (error.error?.error || error.message));
        }
      );
    }
  }

  abrirModalNuevoPago() {
    this.showModalNuevoPago = true;
  }

  cerrarModalPagos() {
    this.showModalPagos = false;
    this.pagosContrato = [];
    this.detalleContrato = null;
  }

  cerrarModalNuevoPago() {
    this.showModalNuevoPago = false;
    this.resetNuevoPago();
  }

  resetNuevoPago() {
    this.nuevoPago = {
      id_contrato: this.contratoSeleccionado,
      monto: 0,
      metodo_pago: 'efectivo',
      descripcion: ''
    };
  }

}
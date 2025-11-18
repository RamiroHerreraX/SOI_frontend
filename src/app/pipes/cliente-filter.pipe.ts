import { Pipe, PipeTransform } from '@angular/core';
import { Cliente } from '../services/cliente';

@Pipe({
  name: 'filter',
  standalone: true
})
export class ClienteFilterPipe implements PipeTransform {

  transform(clientes: Cliente[], nombre: string, correo: string, curp: string, clave: string): Cliente[] {
    if (!clientes) return [];

    nombre = nombre ? nombre.toLowerCase() : '';
    correo = correo ? correo.toLowerCase() : '';
    curp = curp ? curp.toLowerCase() : '';
    clave = clave ? clave.toLowerCase() : '';

    return clientes.filter(c => {
      const coincideNombre =
        (c.nombre?.toLowerCase().includes(nombre) ||
         c.apellido_paterno?.toLowerCase().includes(nombre) ||
         c.apellido_materno?.toLowerCase().includes(nombre));
      const coincideCorreo = c.correo?.toLowerCase().includes(correo);
      const coincideCurp = c.curp?.toLowerCase().includes(curp);
      const coincideClave = c.clave_elector?.toLowerCase().includes(clave);

      return coincideNombre && coincideCorreo && coincideCurp && coincideClave;
    });
  }
}

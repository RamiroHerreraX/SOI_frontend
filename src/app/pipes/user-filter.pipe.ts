import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../services/users.service';

@Pipe({ name: 'userFilter', standalone: true })
export class UserFilterPipe implements PipeTransform {
  transform(
    usuarios: User[],
    nombre: string,
    correo: string,
    telefono: string,
    rolFijo: string,
    filtroRol: string
  ): User[] {
    return usuarios.filter(u => {
      const coincideRolFijo = u.rol === rolFijo;
      const coincideFiltroRol = filtroRol ? u.rol === filtroRol : true;
      const coincideNombre = u.usuario.toLowerCase().includes((nombre || '').toLowerCase());
      const coincideCorreo = u.correo.toLowerCase().includes((correo || '').toLowerCase());
      const coincideTelefono = u.telefono?.includes(telefono || '');
      return coincideRolFijo && coincideFiltroRol && coincideNombre && coincideCorreo && coincideTelefono;
    });
  }
}

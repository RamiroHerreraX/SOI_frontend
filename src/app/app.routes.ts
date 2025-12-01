import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeLoteComponent } from './pages/home-lote/home-lote';
import { Lote } from '../app/pages/lote/lote';
import { HomeAdmin } from './pages/home-admin/home-admin';
import { ClienteComponent } from './pages/cliente/cliente';
import { Pagos } from './pages/pagos/pagos';
import { Contratos } from './pages/contratos/contratos';
import { Usuarios } from './pages/usuarios/usuarios';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { CrearContratoComponent } from './pages/contratos/crear-contrato/crear-contrato.component';
import {AuthGuard} from './guards/auth.guard'
import { VerContratoComponent } from './pages/contratos/ver-contrato/ver-contrato.component';
 
export const routes: Routes = [
  { path: '', component: HomeLoteComponent },   // Ruta principal
  { path: 'lotes', component: Lote, canActivate: [AuthGuard]  },  // CRUD de lotes
  { path: 'home', component: HomeAdmin, canActivate: [AuthGuard]},
  { path: 'clientes', component: ClienteComponent, canActivate: [AuthGuard] },
  { path: 'pagos', component: Pagos, canActivate: [AuthGuard] },
  { path: 'usuarios', component: Usuarios, canActivate: [AuthGuard] },
  { path: 'contratos', component: CrearContratoComponent , canActivate: [AuthGuard]},
  { path: 'Vercontratos', component: VerContratoComponent , canActivate: [AuthGuard]},
  { path: 'auth/login', component: Login },
  { path: '**', redirectTo: '' }
];

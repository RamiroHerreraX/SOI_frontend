import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeLoteComponent } from './pages/home-lote/home-lote';
import { Lote } from '../app/pages/lote/lote';
import { HomeAdmin } from './pages/home-admin/home-admin';
import { Cliente } from './pages/cliente/cliente';
import { Pagos } from './pages/pagos/pagos';
import { Contratos } from './pages/contratos/contratos';
import { Usuarios } from './pages/usuarios/usuarios';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { CrearContratoComponent } from './pages/contratos/crear-contrato/crear-contrato.component';

export const routes: Routes = [
  { path: '', component: HomeLoteComponent },   // Ruta principal
  { path: 'lotes', component: Lote },  // CRUD de lotes
  { path: 'home', component: HomeAdmin },
  { path: 'clientes', component: Cliente },
  { path: 'pagos', component: Pagos },
  { path: 'usuarios', component: Usuarios },
  { path: 'contratos', component: CrearContratoComponent },
  { path: 'contratos', component: Contratos },
  { path: 'auth/login', component: Login },
  { path: 'auth/registro', component: Register },
  { path: '**', redirectTo: '' }       // Cualquier ruta desconocida redirige a Home
];

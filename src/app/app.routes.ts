import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeLoteComponent } from './pages/home-lote/home-lote';
import { Lote } from '../app/pages/lote/lote';
import { HomeAdmin } from './pages/home-admin/home-admin';
import { Cliente } from './pages/cliente/cliente';
import { Pagos } from './pages/pagos/pagos';
import { Contratos } from './pages/contratos/contratos';

export const routes: Routes = [
  { path: '', component: HomeLoteComponent },   // Ruta principal
  { path: 'lotes', component: Lote },  // CRUD de lotes
  { path: 'home', component: HomeAdmin },
  { path: 'clientes', component: Cliente },
  { path: 'pagos', component: Pagos },
   { path: 'contratos', component: Contratos },
  { path: '**', redirectTo: '' }       // Cualquier ruta desconocida redirige a Home
];

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeLote } from './pages/home-lote/home-lote';
import { Lote } from '../app/pages/lote/lote';

export const routes: Routes = [
  { path: '', component: HomeLote },   // Ruta principal
  { path: 'lotes', component: Lote },  // CRUD de lotes
  { path: '**', redirectTo: '' }       // Cualquier ruta desconocida redirige a Home
];

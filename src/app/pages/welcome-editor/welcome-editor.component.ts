import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderAdmin } from "../../shared/header-admin/header-admin";
import { ScrollTopComponent } from "../scroll-top/scroll-top.component";
import { FooterAdmin } from "../../shared/footer-admin/footer-admin";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-welcome-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderAdmin, ScrollTopComponent, FooterAdmin],
  templateUrl: './welcome-editor.component.html',
  styleUrls: ['./welcome-editor.component.css']
})
export class WelcomeEditorComponent {

  welcomeData = {
    background: localStorage.getItem('welcome-bg') || 'assets/default-bg.jpg',
    title: localStorage.getItem('welcome-title') || 'Inmuebles Exclusivos',
    subtitle: localStorage.getItem('welcome-subtitle') ||
      'Descubre terrenos privilegiados para tu proyecto.'
  };

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.welcomeData.background = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  saveChanges() {
    localStorage.setItem('welcome-bg', this.welcomeData.background);
    localStorage.setItem('welcome-title', this.welcomeData.title);
    localStorage.setItem('welcome-subtitle', this.welcomeData.subtitle);

    Swal.fire({
    title: '¡Cambios Guardados!',
    text: 'La sección de bienvenida ha sido actualizada correctamente.',
    icon: 'success',
    confirmButtonColor: '#d4af37',
    confirmButtonText: 'Aceptar',
    background: '#fff',
    color: '#000'
  });
  }
}

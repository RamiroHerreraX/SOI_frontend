import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router'; // Para la navegación y el enlace a Registro

// Asegúrate de que la ruta sea correcta a tu servicio
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  // Importaciones necesarias para formularios y routing
  imports: [CommonModule, ReactiveFormsModule, RouterModule,],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  // Define el FormGroup que contendrá los controles del formulario
  loginForm!: FormGroup;
  errorMessage: string | null = null; // Para mostrar errores de API

  constructor(
    private fb: FormBuilder, 
    private authService: Auth,
    private router: Router // Para redirigir al usuario
  ) {}

  ngOnInit(): void {
    // Inicialización del formulario y definición de validadores
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]], // Email requerido y con formato válido
      password: ['', [Validators.required, Validators.minLength(6)]], // Contraseña requerida y con mínimo de 6 caracteres
    });
  }

  // Método que se llama al enviar el formulario
  onSubmit(): void {
    this.errorMessage = null; // Limpia errores anteriores

    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;
      
      // Llama al servicio de autenticación
      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Login Exitoso:', response);
          // 1. Guardar el Token (ej: localStorage.setItem('token', response.token))
          // 2. Redirigir a una página protegida (ej: dashboard o lotes)
          this.router.navigate(['/lotes']); 
        },
        error: (error) => {
          // Manejo del error de la API (ej: credenciales inválidas)
          console.error('Error de Login:', error);
          this.errorMessage = 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
        }
      });
    } else {
      // Si el formulario no es válido (ej: el usuario intentó enviarlo sin llenar campos)
      this.loginForm.markAllAsTouched();
    }
  }

  // Getter para un acceso fácil a los controles del formulario desde el HTML
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
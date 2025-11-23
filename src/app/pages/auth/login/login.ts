import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

// Importa tu servicio de autenticación (Auth)
import { Auth } from '../../../services/auth'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  // Inicialización directa de la propiedad step
  step: number = 1; // 1 = login, 2 = OTP
  loginForm!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    // Asume que este servicio existe y tiene los métodos login y verifyOtp
    private authService: Auth, 
    private router: Router
  ) {}

  ngOnInit(): void {
    // Inicialización del formulario con un validador vacío para OTP, que se añade luego
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      // OTP no es requerido inicialmente
      otp: [''] 
    });
  }

  // Getters para validaciones simplificados
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get otp() {
    return this.loginForm.get('otp');
  }

  /**
   * Método para restringir la entrada del input a solo números.
   * @param event El evento de pulsación de tecla.
   */
  validateNumericInput(event: KeyboardEvent): boolean {
    // Permite teclas de control (flechas, borrar, etc.)
    const isControlKey = ['ArrowLeft', 'ArrowRight', 'Backspace', 'Tab'].includes(event.key);
    
    // Verifica si la tecla presionada es un dígito (0-9)
    const isDigit = /\d/.test(event.key);

    // Si es una tecla de control o un dígito, se permite la entrada.
    if (isControlKey || isDigit) {
      return true;
    }

    // Si no es ninguna de las anteriores, cancela la entrada de la tecla.
    event.preventDefault();
    return false;
  }

  // ---------- Método principal (llamado por el (ngSubmit)) ----------
  enviarLogin(): void {
    if (this.step === 1) {
      this.loginStep1();
    } else if (this.step === 2) {
      this.verificarOtp();
    }
  }

  // ---------- Paso 1: login con correo y contraseña ----------
  private loginStep1(): void {
    // Solo validamos email y password en este paso
    this.email?.markAsTouched();
    this.password?.markAsTouched();
    
    if (this.email?.invalid || this.password?.invalid) {
      return;
    }

    this.isLoading = true;

    const credentials = {
      correo: this.email?.value,
      password: this.password?.value
    };

    // Llamada al servicio de login
    this.authService.login(credentials).subscribe({
      next: (res: any) => {
        Swal.fire('Éxito', res.msg || 'Código enviado a su correo', 'success');
        this.step = 2; 
        // Agregamos el validador 'required' al OTP para el paso 2
        this.otp?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(6)]);
        this.otp?.updateValueAndValidity();
        this.isLoading = false;
      },
      error: (err: any) => {
        Swal.fire('Error', err.error?.msg || 'Credenciales incorrectas', 'error');
        this.isLoading = false;
      }
    });
  }

  // ---------- Paso 2: verificar OTP ----------
  private verificarOtp(): void {
    this.otp?.markAsTouched();
    
    // Verificamos si el OTP es válido según los validadores del paso 2
    if (this.otp?.invalid) {
        // En este punto, el mensaje de error se mostrará automáticamente en el HTML
        return;
    }

    

    const payload = {
      correo: this.email?.value, // Usamos el correo del paso 1
      otp: this.otp?.value
    };

    // Llamada al servicio de verificación OTP
    this.authService.verifyOtp(payload).subscribe({
      next: (res: any) => {
        Swal.fire('Éxito', 'Login exitoso. Acceso concedido.', 'success');
        // Guardamos el token JWT y redirigimos
        localStorage.setItem('token', res.token); 
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        Swal.fire('Error', err.error?.msg || 'Código es incorrecto o expirado', 'error');
      }
    });
  }

  // ---------- NUEVO: Regresar condicional ----------
  regresar(): void {
    if (this.step === 1) {
      // Caso 1: Regresar al Home
      this.router.navigate(['/']); 
      // NOTA: Cambia '/home' por la ruta de inicio correcta de tu aplicación
    } else if (this.step === 2) {
      // Caso 2: Regresar al Paso 1 del Login
      this.step = 1;
      // Limpiamos el campo OTP y removemos sus validadores
      this.otp?.setValue('');
      this.otp?.clearValidators();
      this.otp?.updateValueAndValidity();
    }
  }
}
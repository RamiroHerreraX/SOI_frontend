import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';

// Servicio de autenticación
import { Auth } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  step: number = 1; // 1 = login, 2 = OTP

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      otp: [''] // opcional, solo se usa en step 2
    });
  }

  // Getters para validaciones
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get otp() {
    return this.loginForm.get('otp');
  }

  // ---------- Método principal ----------
  enviarLogin(): void {
    if (this.step === 1) {
      this.loginStep1();
    } else if (this.step === 2) {
      this.verificarOtp();
    }
  }

  // ---------- Paso 1: login con correo y contraseña ----------
  private loginStep1(): void {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = {
      correo: this.email?.value,
      password: this.password?.value
    };

    this.authService.login(credentials).subscribe({
      next: (res: any) => {
        Swal.fire('Éxito', res.msg, 'success');
        this.step = 2; // avanzar a OTP
      },
      error: (err: any) => {
        Swal.fire('Error', err.error?.msg || 'Error en el login', 'error');
      }
    });
  }

  // ---------- Paso 2: verificar OTP ----------
  private verificarOtp(): void {
    if (!this.otp?.value) {
      Swal.fire('Error', 'Debes ingresar el código OTP', 'warning');
      return;
    }

    const payload = {
      correo: this.email?.value,
      otp: this.otp?.value
    };

    this.authService.verifyOtp(payload).subscribe({
      next: (res: any) => {
        Swal.fire('Éxito', 'Login completo', 'success');
        localStorage.setItem('token', res.token); // guardamos JWT
        this.router.navigate(['/lotes']);
      },
      error: (err: any) => {
        Swal.fire('Error', err.error?.msg || 'OTP incorrecto', 'error');
      }
    });
  }
}

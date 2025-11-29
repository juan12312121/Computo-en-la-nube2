import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
  encapsulation: ViewEncapsulation.None
})
export class Registro {
  username = '';
  nombreCompleto = '';
  email = '';
  password = '';
  mostrarPassword = false;
  
  // Estados de la UI
  cargando = false;
  error = '';
  mensajeExito = '';

  constructor(
    private router: Router,
    private authService: AutenticacionService
  ) {
  }

  // NUEVO MÉTODO: Navegar al principal
  irAPrincipal(): void {
    // Si el usuario ya está autenticado, ir a principal
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/principal']);
    } else {
      // Si no está autenticado, ir a la página de inicio/home
      this.router.navigate(['/']);
    }
  }

  togglePasswordVisibility() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  onSubmit() {
    // Limpiar mensajes previos
    this.error = '';
    this.mensajeExito = '';

    // Validaciones básicas
    if (!this.username || !this.nombreCompleto || !this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (!this.validarEmail(this.email)) {
      this.error = 'Por favor ingresa un correo electrónico válido';
      return;
    }

    // Mostrar loading
    this.cargando = true;

    // Preparar datos para el backend
    const datosRegistro = {
      nombre_usuario: this.username,
      nombre_completo: this.nombreCompleto,
      email: this.email,
      contrasena: this.password
    };

    // Llamar al servicio de autenticación
    this.authService.registro(datosRegistro).subscribe({
      next: (response) => {
        this.cargando = false;
        this.mensajeExito = '¡Cuenta creada exitosamente! Redirigiendo...';
        
        // Redirigir al home o dashboard después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/principal']);
        }, 1500);
      },
      error: (error) => {
        this.cargando = false;
        
        // Mostrar mensaje de error específico del backend
        if (error.error?.mensaje) {
          this.error = error.error.mensaje;
        } else if (error.status === 0) {
          this.error = 'No se pudo conectar con el servidor. Verifica tu conexión.';
        } else {
          this.error = 'Error al crear la cuenta. Por favor intenta de nuevo.';
        }
      }
    });
  }

  // Validar formato de email
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  irALogin() {
    this.router.navigate(['/login']);
  }
}
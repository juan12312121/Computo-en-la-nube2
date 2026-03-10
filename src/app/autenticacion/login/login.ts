import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacionService, LoginRequest } from '../../core/servicios/autenticacion/autenticacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  emailOrUsername: string = '';
  password: string = '';
  showPassword: boolean = false;
  
  // Estados de la UI
  isLoading: boolean = false;
  errorMessage: string = '';
  showError: boolean = false;

  constructor(
    private router: Router,
    private authService: AutenticacionService
  ) {
    // Si ya está autenticado, redirigir a principal
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/principal']);
    }
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    // Resetear mensajes de error
    this.errorMessage = '';
    this.showError = false;

    // Validaciones básicas
    if (!this.emailOrUsername.trim()) {
      this.mostrarError('Por favor ingresa tu correo o nombre de usuario');
      return;
    }

    if (!this.password) {
      this.mostrarError('Por favor ingresa tu contraseña');
      return;
    }

    if (this.password.length < 6) {
      this.mostrarError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Preparar datos para login
    const loginData: LoginRequest = {
      email: this.emailOrUsername.trim(),
      contrasena: this.password
    };

    // Iniciar proceso de login
    this.isLoading = true;
   
    this.authService.login(loginData).subscribe({
      next: (response) => {
        
        if (response.success && response.data) {
          
          
          // Mostrar mensaje de éxito
          this.mostrarExito('¡Bienvenido de vuelta!');
          
          // Redirigir a la página principal después de un breve delay
          setTimeout(() => {
            this.router.navigate(['/principal']);
          }, 500);
        } else {
          this.mostrarError(response.mensaje || 'Error en el inicio de sesión');
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.isLoading = false;
        
        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.mostrarError('Credenciales incorrectas. Verifica tu correo/usuario y contraseña.');
        } else if (error.status === 404) {
          this.mostrarError('Usuario no encontrado. ¿Necesitas registrarte?');
        } else if (error.status === 0) {
          this.mostrarError('No se pudo conectar con el servidor. Verifica tu conexión.');
        } else if (error.error?.mensaje) {
          this.mostrarError(error.error.mensaje);
        } else {
          this.mostrarError('Error al iniciar sesión. Por favor intenta de nuevo.');
        }
      }
    });
  }

  irARegistro(): void {
    this.router.navigate(['/registro']);
  }

  // Método para mostrar errores
  private mostrarError(mensaje: string): void {
    this.errorMessage = mensaje;
    this.showError = true;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.showError = false;
    }, 5000);
  }

  // Método para mostrar mensajes de éxito
  private mostrarExito(mensaje: string): void {
    this.errorMessage = mensaje;
    this.showError = true;
    
    // Auto-ocultar después de 2 segundos
    setTimeout(() => {
      this.showError = false;
    }, 2000);
  }

  // Método para cerrar mensaje manualmente
  cerrarMensaje(): void {
    this.showError = false;
  }
}
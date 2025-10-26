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
    console.log('🚀 Componente Registro inicializado');
  }

  togglePasswordVisibility() {
    this.mostrarPassword = !this.mostrarPassword;
    console.log('Toggle password visibility:', this.mostrarPassword ? 'Visible' : 'Oculta');
  }

  onSubmit() {
    console.log('📝 Iniciando proceso de registro...');
    console.log('📋 Datos del formulario:', {
      username: this.username,
      nombreCompleto: this.nombreCompleto,
      email: this.email,
      passwordLength: this.password.length
    });

    // Limpiar mensajes previos
    this.error = '';
    this.mensajeExito = '';
    console.log('🧹 Mensajes de error/éxito limpiados');

    // Validaciones básicas
    if (!this.username || !this.nombreCompleto || !this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      console.error('❌ Validación fallida: Campos vacíos');
      console.log('   - Username:', this.username ? '✓' : '✗');
      console.log('   - Nombre completo:', this.nombreCompleto ? '✓' : '✗');
      console.log('   - Email:', this.email ? '✓' : '✗');
      console.log('   - Password:', this.password ? '✓' : '✗');
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      console.error('❌ Validación fallida: Contraseña muy corta');
      console.log(`   - Longitud actual: ${this.password.length} caracteres`);
      console.log('   - Longitud mínima: 6 caracteres');
      return;
    }

    if (!this.validarEmail(this.email)) {
      this.error = 'Por favor ingresa un correo electrónico válido';
      console.error('❌ Validación fallida: Email inválido');
      console.log(`   - Email ingresado: ${this.email}`);
      return;
    }

    console.log('✅ Todas las validaciones pasaron');

    // Mostrar loading
    this.cargando = true;
    console.log('⏳ Estado de carga activado');

    // Preparar datos para el backend
    const datosRegistro = {
      nombre_usuario: this.username,
      nombre_completo: this.nombreCompleto,
      email: this.email,
      contrasena: this.password
    };

    console.log('📦 Datos preparados para enviar al backend:', {
      ...datosRegistro,
      contrasena: '***oculta***'
    });

    // Llamar al servicio de autenticación
    console.log('🌐 Enviando petición al servidor...');
    this.authService.registro(datosRegistro).subscribe({
      next: (response) => {
        console.log('✅ Registro exitoso - Respuesta del servidor:', response);
        this.cargando = false;
        console.log('⏳ Estado de carga desactivado');
        
        this.mensajeExito = '¡Cuenta creada exitosamente! Redirigiendo...';
        console.log('🎉 Mensaje de éxito mostrado');
        
        // Redirigir al home o dashboard después de 1.5 segundos
        console.log('⏱️ Iniciando redirección en 1.5 segundos...');
        setTimeout(() => {
          console.log('🔀 Redirigiendo a /principal');
          this.router.navigate(['/principal']);
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Error en registro:', error);
        console.log('📊 Detalles del error:');
        console.log('   - Status:', error.status);
        console.log('   - StatusText:', error.statusText);
        console.log('   - Error completo:', error.error);
        
        this.cargando = false;
        console.log('⏳ Estado de carga desactivado');
        
        // Mostrar mensaje de error específico del backend
        if (error.error?.mensaje) {
          this.error = error.error.mensaje;
          console.log('💬 Mensaje de error del backend:', error.error.mensaje);
        } else if (error.status === 0) {
          this.error = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          console.error('🔌 Error de conexión: No se puede alcanzar el servidor');
        } else {
          this.error = 'Error al crear la cuenta. Por favor intenta de nuevo.';
          console.error(`⚠️ Error genérico con status ${error.status}`);
        }
        
        console.log('🚨 Error mostrado al usuario:', this.error);
      }
    });
  }

  // Validar formato de email
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const esValido = regex.test(email);
    console.log('📧 Validación de email:', {
      email: email,
      esValido: esValido,
      regex: regex.toString()
    });
    return esValido;
  }

  irALogin() {
    console.log('🔀 Navegando a la página de login');
    this.router.navigate(['/login']);
  }
}
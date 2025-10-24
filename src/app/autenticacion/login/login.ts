import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  mantenerSesion: boolean = false;
  showPassword: boolean = false;

  constructor(private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    console.log('Login attempt:', {
      emailOrUsername: this.emailOrUsername,
      password: this.password,
      mantenerSesion: this.mantenerSesion
    });

    // Aquí iría la lógica de autenticación
    // Por ahora solo redirigimos
    // this.router.navigate(['/principal']);
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }
}

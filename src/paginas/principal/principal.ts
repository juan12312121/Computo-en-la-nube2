\// src/paginas/principal/principal.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../componentes/navbar/navbar'; // sin .ts y ruta relativa CORRECTA

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './principal.html',
  styleUrls: ['./principal.css']
})
export class Principal {
  showCreateModal = false;

  openCreateModal() { this.showCreateModal = true; }
  closeCreateModal() { this.showCreateModal = false; }
}

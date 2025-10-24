import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // <- IMPORTANTE: Agregar esta línea

@Component({
  selector: 'app-boton-crear-post',
  standalone: true,
  imports: [CommonModule, FormsModule],  // <- Agregar FormsModule aquí
  templateUrl: './boton-crear-post.html',
  styleUrl: './boton-crear-post.css'
})
export class BotonCrearPost {
  @Output() close = new EventEmitter<void>();
  
  postContent = '';
  selectedImage: string | null = null;

  closeModal() {
    this.close.emit();
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
  }

  publicarPost() {
    if (this.postContent.trim()) {
      console.log('Publicando:', this.postContent);
      console.log('Imagen:', this.selectedImage);
      // Aquí iría la lógica para enviar al backend
      this.postContent = '';
      this.selectedImage = null;
      this.closeModal();
    }
  }
}

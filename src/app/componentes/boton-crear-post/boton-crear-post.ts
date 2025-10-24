import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-boton-crear-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boton-crear-post.html',
  styleUrl: './boton-crear-post.css'
})
export class BotonCrearPost {
  @Output() close = new EventEmitter<void>();
  
  postContent = '';
  selectedImage: string | null = null;
  mostrarEmojiPicker = false;
  emojis: any[] = [];
  emojisCargados = false;

  ngOnInit() {
    this.cargarEmojis();
  }

  async cargarEmojis() {
    try {
      const response = await fetch('https://emoji-api.com/emojis?access_key=0379a50d81310255953239ec6ac0698f02d69167');
      const data = await response.json();
      // Tomar los primeros 72 emojis para mejor distribución en grid
      this.emojis = data.slice(0, 72);
      this.emojisCargados = true;
    } catch (error) {
      console.error('Error cargando emojis:', error);
      // Emojis de respaldo si falla la API
      this.emojis = [
        { character: '😀', unicodeName: 'grinning face' },
        { character: '😂', unicodeName: 'face with tears of joy' },
        { character: '😍', unicodeName: 'smiling face with heart-eyes' },
        { character: '🥰', unicodeName: 'smiling face with hearts' },
        { character: '😊', unicodeName: 'smiling face with smiling eyes' },
        { character: '😎', unicodeName: 'smiling face with sunglasses' },
        { character: '🤗', unicodeName: 'hugging face' },
        { character: '🤔', unicodeName: 'thinking face' },
        { character: '😴', unicodeName: 'sleeping face' },
        { character: '🤯', unicodeName: 'exploding head' },
        { character: '😭', unicodeName: 'loudly crying face' },
        { character: '😱', unicodeName: 'face screaming in fear' },
        { character: '🎉', unicodeName: 'party popper' },
        { character: '🎊', unicodeName: 'confetti ball' },
        { character: '🎈', unicodeName: 'balloon' },
        { character: '🎁', unicodeName: 'wrapped gift' },
        { character: '❤️', unicodeName: 'red heart' },
        { character: '💙', unicodeName: 'blue heart' },
        { character: '💚', unicodeName: 'green heart' },
        { character: '💛', unicodeName: 'yellow heart' },
        { character: '👍', unicodeName: 'thumbs up' },
        { character: '👎', unicodeName: 'thumbs down' },
        { character: '👏', unicodeName: 'clapping hands' },
        { character: '🙌', unicodeName: 'raising hands' },
        { character: '🔥', unicodeName: 'fire' },
        { character: '✨', unicodeName: 'sparkles' },
        { character: '⭐', unicodeName: 'star' },
        { character: '🌟', unicodeName: 'glowing star' },
        { character: '💪', unicodeName: 'flexed biceps' },
        { character: '🎓', unicodeName: 'graduation cap' },
        { character: '📚', unicodeName: 'books' },
        { character: '📖', unicodeName: 'open book' },
        { character: '💡', unicodeName: 'light bulb' },
        { character: '🚀', unicodeName: 'rocket' },
        { character: '⚡', unicodeName: 'high voltage' },
        { character: '🌈', unicodeName: 'rainbow' }
      ];
      this.emojisCargados = true;
    }
  }

  toggleEmojiPicker() {
    this.mostrarEmojiPicker = !this.mostrarEmojiPicker;
    
    // Prevenir scroll del body en móvil cuando el picker está abierto
    if (this.mostrarEmojiPicker) {
      document.body.classList.add('emoji-picker-open');
    } else {
      document.body.classList.remove('emoji-picker-open');
    }
  }

  agregarEmoji(emoji: string) {
    this.postContent += emoji;
    this.mostrarEmojiPicker = false;
    document.body.classList.remove('emoji-picker-open');
  }

  closeModal() {
    document.body.classList.remove('emoji-picker-open');
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
      this.mostrarEmojiPicker = false;
      document.body.classList.remove('emoji-picker-open');
      this.closeModal();
    }
  }

  ngOnDestroy() {
    // Limpiar la clase del body al destruir el componente
    document.body.classList.remove('emoji-picker-open');
  }
}
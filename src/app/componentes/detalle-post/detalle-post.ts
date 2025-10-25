import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  avatarColor: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image: string | null;
  category: string;
  categoryColor: string;
  likes: number;
  liked: boolean;
  shares: number;
  avatarColor: string;
  comments: Comment[];
}

@Component({
  selector: 'app-detalle-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-post.html',
  styleUrl: './detalle-post.css'
})
export class DetallePost {
  @Input() post: Post | null = null;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() likeToggled = new EventEmitter<number>();
  @Output() commentAdded = new EventEmitter<{postId: number, comment: string}>();

  commentInput: string = '';

  closeModal(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  toggleLike(): void {
    if (this.post) {
      this.likeToggled.emit(this.post.id);
    }
  }

  addComment(): void {
    const text = this.commentInput.trim();
    if (!text || !this.post) return;

    this.commentAdded.emit({
      postId: this.post.id,
      comment: text
    });
    this.commentInput = '';
  }

  onCommentKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addComment();
    }
  }
}

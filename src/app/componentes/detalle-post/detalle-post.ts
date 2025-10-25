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

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
  avatarColor: string;
  isFollowing: boolean;
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
  showShareModal: boolean = false;
  searchQuery: string = '';
  selectedTab: 'redes' | 'usuarios' = 'redes';
  linkCopied: boolean = false;

  // Usuarios de ejemplo
  users: User[] = [
    { id: 1, name: 'Juan López', username: '@juanlopez', avatar: 'JL', avatarColor: 'from-orange-400 to-orange-600', isFollowing: true },
    { id: 2, name: 'Ana García', username: '@anagarcia', avatar: 'AG', avatarColor: 'from-purple-400 to-purple-600', isFollowing: true },
    { id: 3, name: 'Carlos Ruiz', username: '@carlosruiz', avatar: 'CR', avatarColor: 'from-blue-400 to-blue-600', isFollowing: false },
    { id: 4, name: 'Laura Martínez', username: '@lauramtz', avatar: 'LM', avatarColor: 'from-pink-400 to-pink-600', isFollowing: true },
    { id: 5, name: 'Pedro Sánchez', username: '@pedrosanchez', avatar: 'PS', avatarColor: 'from-green-400 to-green-600', isFollowing: false },
    { id: 6, name: 'Sofia Torres', username: '@sofiatorres', avatar: 'ST', avatarColor: 'from-teal-400 to-teal-600', isFollowing: true }
  ];

  selectedUsers: number[] = [];

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

  openShareModal(): void {
    this.showShareModal = true;
    this.searchQuery = '';
    this.selectedUsers = [];
    this.linkCopied = false;
    document.body.style.overflow = 'hidden';
  }

  closeShareModal(): void {
    this.showShareModal = false;
    document.body.style.overflow = 'auto';
  }

  onShareBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('share-modal-backdrop')) {
      this.closeShareModal();
    }
  }

  switchShareTab(tab: 'redes' | 'usuarios'): void {
    this.selectedTab = tab;
    this.searchQuery = '';
  }

  get filteredUsers(): User[] {
    if (!this.searchQuery.trim()) {
      return this.users;
    }
    const query = this.searchQuery.toLowerCase();
    return this.users.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  }

  toggleUserSelection(userId: number): void {
    const index = this.selectedUsers.indexOf(userId);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(userId);
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUsers.includes(userId);
  }

  shareToSocial(platform: string): void {
    const postUrl = `https://redstudent.com/post/${this.post?.id}`;
    const text = this.post?.content || '';

    let shareUrl = '';

    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + postUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Mira esta publicación')}&body=${encodeURIComponent(text + '\n\n' + postUrl)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  }

  copyLink(): void {
    const postUrl = `https://redstudent.com/post/${this.post?.id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 2000);
    });
  }

  sendToUsers(): void {
    if (this.selectedUsers.length === 0) return;

    // Aquí implementarías la lógica para enviar el post a los usuarios seleccionados
    console.log('Compartiendo con usuarios:', this.selectedUsers);

    // Mostrar mensaje de éxito
    alert(`Publicación compartida con ${this.selectedUsers.length} usuario(s)`);
    this.closeShareModal();
  }
}

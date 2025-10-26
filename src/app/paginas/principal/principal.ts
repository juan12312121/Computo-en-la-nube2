import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DetallePost } from '../../componentes/detalle-post/detalle-post';
import { NavbarComponent } from '../../componentes/navbar/navbar';
import { Theme, ThemeService } from '../../core/servicios/temas';

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
  showComments?: boolean;
}

@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, DetallePost],
  templateUrl: './principal.html',
  styleUrls: ['./principal.css']
})
export class Principal implements OnInit, OnDestroy {
  showCreateModal = false;
  showPostDetailModal = false;
  selectedPost: Post | null = null;

  // Tema actual
  currentTheme!: Theme;
  private themeSubscription?: Subscription;

  posts: Post[] = [
    {
      id: 1,
      author: 'María Rodríguez',
      avatar: 'MR',
      time: 'Hace 2 horas',
      content: '¡Hola compañeros! Les comparto mi experiencia con el proyecto final de Desarrollo Web. Después de semanas de trabajo, logré crear una aplicación completa con React y Node.js. Si alguien necesita ayuda con el proyecto, con gusto puedo compartir algunos recursos que me fueron útiles. 💻✨',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=500&fit=crop',
      category: 'Programación',
      categoryColor: 'bg-teal-500',
      likes: 127,
      liked: true,
      shares: 8,
      avatarColor: 'linear-gradient(to bottom right, #2dd4bf, #0d9488)',
      showComments: false,
      comments: [
        { id: 1, author: 'Juan López', avatar: 'JL', text: '¡Increíble María! Me encantaría ver tu código. ¿Podrías compartir el repositorio de GitHub?', time: '1 h', avatarColor: 'linear-gradient(to bottom right, #2dd4bf, #0d9488)' },
        { id: 2, author: 'Ana Pérez', avatar: 'AP', text: '¡Felicidades por tu proyecto! Yo también estoy usando React y me ha costado un poco.', time: '45 min', avatarColor: 'linear-gradient(to bottom right, #ec4899, #db2777)' },
        { id: 3, author: 'Carlos Martínez', avatar: 'CM', text: 'Excelente trabajo María. Tu dedicación es inspiradora.', time: '30 min', avatarColor: 'linear-gradient(to bottom right, #6366f1, #8b5cf6)' }
      ]
    },
    {
      id: 2,
      author: 'Diego Sánchez',
      avatar: 'DS',
      time: 'Hace 5 horas',
      content: '📚 Recordatorio para todos: mañana es la presentación del proyecto de Inteligencia Artificial. No olviden llevar sus laptops y tener las diapositivas listas. ¡Nos vemos en el auditorio a las 10:00 AM! Mucho éxito a todos los equipos 🎯',
      image: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&h=500&fit=crop',
      category: 'Inteligencia Artificial',
      categoryColor: 'bg-orange-500',
      likes: 89,
      liked: false,
      shares: 12,
      avatarColor: 'linear-gradient(to bottom right, #f97316, #ea580c)',
      showComments: false,
      comments: [
        { id: 4, author: 'Laura García', avatar: 'LG', text: 'Gracias por el recordatorio Diego! ¿Sabes cuánto tiempo tenemos para cada presentación?', time: '3 h', avatarColor: 'linear-gradient(to bottom right, #fbbf24, #f59e0b)' },
        { id: 5, author: 'Roberto Fernández', avatar: 'RF', text: 'Mi equipo está muy nervioso pero emocionado. Hemos trabajado mucho en nuestro modelo 🤖', time: '2 h', avatarColor: 'linear-gradient(to bottom right, #2dd4bf, #0d9488)' }
      ]
    },
    {
      id: 3,
      author: 'Valeria Castro',
      avatar: 'VC',
      time: 'Hace 1 día',
      content: '🎉 ¡Gran noticia! Nuestro equipo de robótica ganó el primer lugar en la competencia regional. Gracias a todos los que nos apoyaron y creyeron en nosotros. Este es solo el comienzo, ahora vamos por la competencia nacional. ¡Unidos somos más fuertes! 🏆🤖',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=500&fit=crop',
      category: 'Robótica',
      categoryColor: 'bg-purple-600',
      likes: 245,
      liked: true,
      shares: 28,
      avatarColor: 'linear-gradient(to bottom right, #a855f7, #9333ea)',
      showComments: false,
      comments: [
        { id: 7, author: 'Pablo Aguilar', avatar: 'PA', text: '¡Felicidades al equipo! Fue increíble ver su robot en acción 👏', time: '20 h', avatarColor: 'linear-gradient(to bottom right, #6366f1, #8b5cf6)' },
        { id: 8, author: 'Mónica Hernández', avatar: 'MH', text: '¡Qué orgullo! Representan a nuestra universidad de la mejor manera 💜', time: '18 h', avatarColor: 'linear-gradient(to bottom right, #ec4899, #db2777)' }
      ]
    }
  ];

  commentInputs: { [key: number]: string } = {};

  constructor(private themeService: ThemeService) {
    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit(): void {
    // Suscribirse a cambios de tema
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      console.log('🎨 Tema actualizado en Principal:', theme.name);
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  get currentThemeData(): Theme {
    return this.currentTheme;
  }

  getThemeRingColor(): string {
    // Extrae el color primario del tema para el ring del input
    const colorMap: { [key: string]: string } = {
      'default': '#f97316',
      'midnight': '#6366f1',
      'forest': '#10b981',
      'sunset': '#f59e0b',
      'ocean': '#0ea5e9',
      'rose': '#ec4899',
      'slate': '#64748b',
      'lavender': '#a78bfa',
      'neon': '#0ff',
      'toxic': '#84cc16',
      'candy': '#ec4899',
      'chaos': '#ff0000'
    };
    return colorMap[this.currentTheme.id] || '#f97316';
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openPostDetail(postId: number) {
    this.selectedPost = this.posts.find(p => p.id === postId) || null;
    this.showPostDetailModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePostDetail() {
    this.showPostDetailModal = false;
    this.selectedPost = null;
    document.body.style.overflow = 'auto';
  }

  toggleLike(postId: number) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.liked = !post.liked;
      post.likes = post.liked ? post.likes + 1 : post.likes - 1;
    }
  }

  toggleComments(postId: number) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.showComments = !post.showComments;
    }
  }

  addComment(postId: number) {
    const text = this.commentInputs[postId]?.trim();
    if (!text) return;

    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.comments.push({
        id: Date.now(),
        author: 'Tú',
        avatar: 'TU',
        text: text,
        time: 'Ahora',
        avatarColor: 'linear-gradient(to bottom right, #3b82f6, #2563eb)'
      });
      this.commentInputs[postId] = '';
    }
  }

  handleCommentAdded(event: {postId: number, comment: string}) {
    const post = this.posts.find(p => p.id === event.postId);
    if (post) {
      post.comments.push({
        id: Date.now(),
        author: 'Tú',
        avatar: 'TU',
        text: event.comment,
        time: 'Ahora',
        avatarColor: 'linear-gradient(to bottom right, #3b82f6, #2563eb)'
      });
    }
  }

  onCommentKeyPress(event: KeyboardEvent, postId: number) {
    if (event.key === 'Enter') {
      this.addComment(postId);
    }
  }
}
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AutenticacionService, Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Categoria, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { Theme, ThemeService } from '../../core/servicios/temas';

@Component({
  selector: 'app-boton-crear-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boton-crear-post.html',
  styleUrl: './boton-crear-post.css'
})
export class BotonCrearPost implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() postCreado = new EventEmitter<void>();

  // ✅ Usuario autenticado
  currentUser: Usuario | null = null;
  private authSubscription?: Subscription;
  private themeSubscription?: Subscription;

  // ✅ API Base URL
  apiBaseUrl: string;

  postContent = '';
  selectedImage: string | null = null;
  selectedFile: File | null = null;
  mostrarEmojiPicker = false;
  emojis: any[] = [];
  emojisCargados = false;
  publicando = false;
  mensajeError = '';

  // ✅ Categorías
  categorias: Categoria[] = [];
  categoriaSeleccionada = 'General';
  mostrarSelectorCategoria = false;

  // ✅ Tema actual
  currentTheme: Theme;

  constructor(
    private publicacionesService: PublicacionesService,
    private authService: AutenticacionService,
    private themeService: ThemeService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {
    // ✅ Configurar API Base URL
    const host = window.location.hostname;
    this.apiBaseUrl = (host === 'localhost' || host === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'http://3.146.83.30:3000';

    this.currentTheme = this.themeService.getCurrentTheme();
  }

  ngOnInit() {
    this.cargarEmojis();
    this.cargarCategorias();

    // ✅ Suscribirse al usuario autenticado
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    // ✅ Suscribirse a los cambios de tema y aplicar atributo data-theme
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      this.aplicarTema(theme);
      console.log('🎨 Tema actualizado en modal crear post:', this.currentTheme.name);
    });

    // Aplicar tema inicial
    this.aplicarTema(this.currentTheme);
  }

  ngOnDestroy() {
    document.body.classList.remove('emoji-picker-open');

    // ✅ Limpiar suscripciones
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  // ✅ Aplicar tema al componente basado en tu ThemeService
  private aplicarTema(theme: Theme) {
    const hostElement = this.elementRef.nativeElement;
    
    // Aplicar el ID del tema como data-theme
    this.renderer.setAttribute(hostElement, 'data-theme', theme.id);
    
    // Aplicar variables CSS personalizadas basadas en las propiedades del tema
    const primaryColor = this.extractPrimaryColor(theme);
    const accentColor = this.extractAccentColor(theme);
    const pickerBgColor = this.getPickerBgColor(theme);
    const pickerBorderColor = this.getPickerBorderColor(theme);
    const pickerTextColor = this.getPickerTextColor(theme);
    
    // Establecer variables CSS
    this.renderer.setStyle(hostElement, '--primary-color', primaryColor);
    this.renderer.setStyle(hostElement, '--accent-color', accentColor);
    this.renderer.setStyle(hostElement, '--picker-bg-color', pickerBgColor);
    this.renderer.setStyle(hostElement, '--picker-border-color', pickerBorderColor);
    this.renderer.setStyle(hostElement, '--picker-text-color', pickerTextColor);
    
    // Variables para backgrounds basadas en el tema
    if (theme.bodyClass.includes('bg-gray-50') || theme.bodyClass.includes('bg-green-50') || 
        theme.bodyClass.includes('bg-orange-50') || theme.bodyClass.includes('bg-sky-50') ||
        theme.bodyClass.includes('bg-pink-50') || theme.bodyClass.includes('bg-violet-50') ||
        theme.bodyClass.includes('bg-slate-100')) {
      // Temas claros
      this.renderer.setStyle(hostElement, '--scrollbar-track-bg', '#f1f5f9');
      this.renderer.setStyle(hostElement, '--hover-bg-color', `${primaryColor}1a`); // 10% opacity
      this.renderer.setStyle(hostElement, '--active-bg-color', `${primaryColor}33`); // 20% opacity
    } else if (theme.bodyClass.includes('bg-slate-950') || theme.bodyClass.includes('bg-black') || 
               theme.bodyClass.includes('bg-zinc-900')) {
      // Temas oscuros
      this.renderer.setStyle(hostElement, '--scrollbar-track-bg', '#374151');
      this.renderer.setStyle(hostElement, '--hover-bg-color', `${primaryColor}26`); // 15% opacity
      this.renderer.setStyle(hostElement, '--active-bg-color', `${primaryColor}40`); // 25% opacity
    } else {
      // Temas especiales (candy, chaos)
      this.renderer.setStyle(hostElement, '--scrollbar-track-bg', '#f1f5f9');
      this.renderer.setStyle(hostElement, '--hover-bg-color', `${primaryColor}1a`);
      this.renderer.setStyle(hostElement, '--active-bg-color', `${primaryColor}33`);
    }
  }

  // ✅ Obtener color de fondo del picker según el tema
  private getPickerBgColor(theme: Theme): string {
    // Temas oscuros
    if (theme.id === 'midnight') return '#0f172a';
    if (theme.id === 'neon') return '#111827';
    if (theme.id === 'toxic') return '#18181b';
    // Temas especiales
    if (theme.id === 'candy') return '#fdf4ff';
    if (theme.id === 'chaos') return '#fef9c3';
    // Temas claros
    return '#ffffff';
  }

  // ✅ Obtener color del borde del picker según el tema
  private getPickerBorderColor(theme: Theme): string {
    const borderMap: { [key: string]: string } = {
      'midnight': '#334155',
      'neon': '#374151',
      'toxic': '#3f3f46',
      'forest': '#d1fae5',
      'sunset': '#fed7aa',
      'ocean': '#bae6fd',
      'rose': '#fbcfe8',
      'slate': '#cbd5e1',
      'lavender': '#ddd6fe',
      'candy': '#f9a8d4',
      'chaos': '#fb923c'
    };
    return borderMap[theme.id] || '#e5e7eb';
  }

  // ✅ Obtener color del texto del picker según el tema
  private getPickerTextColor(theme: Theme): string {
    // Temas oscuros tienen texto claro
    if (theme.id === 'midnight') return '#e2e8f0';
    if (theme.id === 'neon') return '#22d3ee';
    if (theme.id === 'toxic') return '#84cc16';
    // Temas especiales
    if (theme.id === 'candy') return '#831843';
    if (theme.id === 'chaos') return '#1e3a8a';
    // Temas claros tienen texto oscuro
    return '#1f2937';
  }

  // ✅ Extraer color primario del tema
  private extractPrimaryColor(theme: Theme): string {
    // Mapeo de colores Tailwind a valores hex
    const colorMap: { [key: string]: string } = {
      'orange-500': '#f97316',
      'orange-600': '#ea580c',
      'indigo-500': '#6366f1',
      'indigo-400': '#818cf8',
      'emerald-500': '#10b981',
      'green-600': '#059669',
      'amber-500': '#f59e0b',
      'red-500': '#ef4444',
      'sky-500': '#0ea5e9',
      'cyan-500': '#06b6d4',
      'pink-500': '#ec4899',
      'rose-500': '#f43f5e',
      'slate-600': '#475569',
      'violet-500': '#8b5cf6',
      'purple-500': '#a855f7',
      'cyan-400': '#22d3ee',
      'fuchsia-500': '#d946ef',
      'lime-500': '#84cc16',
      'yellow-400': '#facc15'
    };

    // Buscar en bgPrimary
    for (const [tailwindClass, hexColor] of Object.entries(colorMap)) {
      if (theme.bgPrimary?.includes(tailwindClass)) {
        return hexColor;
      }
    }

    // Fallback
    return '#f97316';
  }

  // ✅ Extraer color de acento del tema
  private extractAccentColor(theme: Theme): string {
    const colorMap: { [key: string]: string } = {
      'teal-400': '#2dd4bf',
      'teal-500': '#14b8a6',
      'purple-500': '#a855f7',
      'green-600': '#16a34a',
      'red-500': '#ef4444',
      'cyan-500': '#06b6d4',
      'rose-500': '#f43f5e',
      'slate-700': '#334155',
      'purple-400': '#c084fc',
      'yellow-400': '#facc15',
      'green-500': '#22c55e'
    };

    // Buscar en textSecondary o checkIcon
    for (const [tailwindClass, hexColor] of Object.entries(colorMap)) {
      if (theme.textSecondary?.includes(tailwindClass) || theme.checkIcon?.includes(tailwindClass)) {
        return hexColor;
      }
    }

    // Fallback
    return '#2dd4bf';
  }

  // ✅ Cargar categorías desde el backend
  cargarCategorias() {
    this.publicacionesService.obtenerCategorias().subscribe({
      next: (response) => {
        this.categorias = response.data;
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
        // Categorías de fallback
        this.categorias = [
          { value: 'General', label: 'General', color: 'bg-orange-500' },
          { value: 'Tecnología', label: 'Tecnología', color: 'bg-teal-500' },
          { value: 'Ciencias', label: 'Ciencias', color: 'bg-purple-500' },
          { value: 'Artes y Cultura', label: 'Artes y Cultura', color: 'bg-pink-500' },
          { value: 'Deportes', label: 'Deportes', color: 'bg-blue-500' },
          { value: 'Salud y Bienestar', label: 'Salud y Bienestar', color: 'bg-green-500' },
          { value: 'Vida Universitaria', label: 'Vida Universitaria', color: 'bg-orange-600' },
          { value: 'Opinión', label: 'Opinión', color: 'bg-indigo-500' },
          { value: 'Entrevistas', label: 'Entrevistas', color: 'bg-yellow-500' }
        ];
      }
    });
  }

  // ✅ Toggle selector de categoría
  toggleSelectorCategoria() {
    this.mostrarSelectorCategoria = !this.mostrarSelectorCategoria;
    if (this.mostrarSelectorCategoria) {
      this.mostrarEmojiPicker = false;
      document.body.classList.remove('emoji-picker-open');
    }
  }

  // ✅ Seleccionar categoría
  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    this.mostrarSelectorCategoria = false;
  }

  // ✅ Obtener categoría actual completa
  get categoriaActual(): Categoria | undefined {
    return this.categorias.find(c => c.value === this.categoriaSeleccionada);
  }

  // ✅ GETTERS para datos del usuario
  get userName(): string {
    return this.currentUser?.nombre_completo || 'Usuario';
  }

  get userUsername(): string {
    return this.currentUser?.nombre_usuario ? `@${this.currentUser.nombre_usuario}` : '@usuario';
  }

  get userAvatar(): string {
    if (!this.currentUser?.foto_perfil_url) {
      return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.userName) + '&background=random&size=200';
    }

    if (this.currentUser.foto_perfil_url.startsWith('http')) {
      return this.currentUser.foto_perfil_url;
    }

    return `${this.apiBaseUrl}${this.currentUser.foto_perfil_url}`;
  }

  async cargarEmojis() {
    try {
      const response = await fetch('https://emoji-api.com/emojis?access_key=0379a50d81310255953239ec6ac0698f02d69167');
      const data = await response.json();
      this.emojis = data.slice(0, 72);
      this.emojisCargados = true;
    } catch (error) {
      console.error('Error cargando emojis:', error);
      // Fallback emojis si la API falla
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

    if (this.mostrarEmojiPicker) {
      this.mostrarSelectorCategoria = false;
      document.body.classList.add('emoji-picker-open');
    } else {
      document.body.classList.remove('emoji-picker-open');
    }
  }

  agregarEmoji(emoji: string) {
    this.postContent += emoji;
    // El emoji picker permanece abierto después de seleccionar un emoji
  }

  closeModal() {
    document.body.classList.remove('emoji-picker-open');
    this.close.emit();
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.selectedFile = null;
  }

  publicarPost() {
    if (!this.postContent.trim()) {
      return;
    }

    this.publicando = true;
    this.mensajeError = '';

    const formData = this.publicacionesService.crearFormData({
      contenido: this.postContent.trim(),
      categoria: this.categoriaSeleccionada,
      imagen: this.selectedFile || undefined
    });

    this.publicacionesService.crearPublicacion(formData).subscribe({
      next: (response) => {
        // Resetear formulario
        this.postContent = '';
        this.selectedImage = null;
        this.selectedFile = null;
        this.mostrarEmojiPicker = false;
        this.mostrarSelectorCategoria = false;
        this.categoriaSeleccionada = 'General';
        this.publicando = false;

        document.body.classList.remove('emoji-picker-open');

        // Emitir evento de éxito
        this.postCreado.emit();
        this.closeModal();
      },
      error: (error) => {
        console.error('❌ Error al crear publicación:', error);
        this.mensajeError = error.error?.message || 'Error al publicar. Intenta de nuevo.';
        this.publicando = false;
      }
    });
  }
}
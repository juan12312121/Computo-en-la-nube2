import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AutenticacionService, Usuario } from '../../core/servicios/autenticacion/autenticacion';
import { Categoria, PublicacionesService } from '../../core/servicios/publicaciones/publicaciones';
import { Theme, ThemeService } from '../../core/servicios/temas';

// 🆕 Interface para documentos adjuntos
interface DocumentoAdjunto {
  file: File;
  preview: string;
  icono: string;
  color: string;
  nombre: string;
}

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

  // ✅ URLs Base
  public readonly apiBaseUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'http://3.146.83.30:3000';
  public readonly s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';

  postContent = '';
  selectedImage: string | null = null;
  selectedFile: File | null = null;
  
  // 🆕 Documentos adjuntos
  documentosAdjuntos: DocumentoAdjunto[] = [];
  readonly MAX_DOCUMENTOS = 5;
  
  mostrarEmojiPicker = false;
  emojis: any[] = [];
  emojisCargados = false;
  publicando = false;
  mensajeError = '';
  tipoError: 'error' | 'warning' | 'censura' = 'error';

  // ✅ Categorías
  categorias: Categoria[] = [];
  categoriaSeleccionada = 'General';
  mostrarSelectorCategoria = false;

  @Output() publicacionCreada = new EventEmitter<any>();


  // ✅ Tema actual
  currentTheme: Theme;

  constructor(
    private publicacionesService: PublicacionesService,
    private authService: AutenticacionService,
    private themeService: ThemeService,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {
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
    
    this.renderer.setAttribute(hostElement, 'data-theme', theme.id);
    
    const primaryColor = this.extractPrimaryColor(theme);
    const accentColor = this.extractAccentColor(theme);
    const pickerBgColor = this.getPickerBgColor(theme);
    const pickerBorderColor = this.getPickerBorderColor(theme);
    const pickerTextColor = this.getPickerTextColor(theme);
    
    this.renderer.setStyle(hostElement, '--primary-color', primaryColor);
    this.renderer.setStyle(hostElement, '--accent-color', accentColor);
    this.renderer.setStyle(hostElement, '--picker-bg-color', pickerBgColor);
    this.renderer.setStyle(hostElement, '--picker-border-color', pickerBorderColor);
    this.renderer.setStyle(hostElement, '--picker-text-color', pickerTextColor);
    
    if (theme.bodyClass.includes('bg-gray-50') || theme.bodyClass.includes('bg-green-50') || 
        theme.bodyClass.includes('bg-orange-50') || theme.bodyClass.includes('bg-sky-50') ||
        theme.bodyClass.includes('bg-pink-50') || theme.bodyClass.includes('bg-violet-50') ||
        theme.bodyClass.includes('bg-slate-100')) {
      this.renderer.setStyle(hostElement, '--scrollbar-track-bg', '#f1f5f9');
      this.renderer.setStyle(hostElement, '--hover-bg-color', `${primaryColor}1a`);
      this.renderer.setStyle(hostElement, '--active-bg-color', `${primaryColor}33`);
    } else if (theme.bodyClass.includes('bg-slate-950') || theme.bodyClass.includes('bg-black') || 
               theme.bodyClass.includes('bg-zinc-900')) {
      this.renderer.setStyle(hostElement, '--scrollbar-track-bg', '#374151');
      this.renderer.setStyle(hostElement, '--hover-bg-color', `${primaryColor}26`);
      this.renderer.setStyle(hostElement, '--active-bg-color', `${primaryColor}40`);
    } else {
      this.renderer.setStyle(hostElement, '--scrollbar-track-bg', '#f1f5f9');
      this.renderer.setStyle(hostElement, '--hover-bg-color', `${primaryColor}1a`);
      this.renderer.setStyle(hostElement, '--active-bg-color', `${primaryColor}33`);
    }
  }

  private getPickerBgColor(theme: Theme): string {
    if (theme.id === 'midnight') return '#0f172a';
    if (theme.id === 'neon') return '#111827';
    if (theme.id === 'toxic') return '#18181b';
    if (theme.id === 'candy') return '#fdf4ff';
    if (theme.id === 'chaos') return '#fef9c3';
    return '#ffffff';
  }

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

  private getPickerTextColor(theme: Theme): string {
    if (theme.id === 'midnight') return '#e2e8f0';
    if (theme.id === 'neon') return '#22d3ee';
    if (theme.id === 'toxic') return '#84cc16';
    if (theme.id === 'candy') return '#831843';
    if (theme.id === 'chaos') return '#1e3a8a';
    return '#1f2937';
  }

  private extractPrimaryColor(theme: Theme): string {
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

    for (const [tailwindClass, hexColor] of Object.entries(colorMap)) {
      if (theme.bgPrimary?.includes(tailwindClass)) {
        return hexColor;
      }
    }

    return '#f97316';
  }

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

    for (const [tailwindClass, hexColor] of Object.entries(colorMap)) {
      if (theme.textSecondary?.includes(tailwindClass) || theme.checkIcon?.includes(tailwindClass)) {
        return hexColor;
      }
    }

    return '#2dd4bf';
  }

  cargarCategorias() {
    this.publicacionesService.obtenerCategorias().subscribe({
      next: (response) => {
        this.categorias = response.data;
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
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

  toggleSelectorCategoria() {
    this.mostrarSelectorCategoria = !this.mostrarSelectorCategoria;
    if (this.mostrarSelectorCategoria) {
      this.mostrarEmojiPicker = false;
      document.body.classList.remove('emoji-picker-open');
    }
  }

  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
    this.mostrarSelectorCategoria = false;
  }

  get categoriaActual(): Categoria | undefined {
    return this.categorias.find(c => c.value === this.categoriaSeleccionada);
  }

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

  // 🆕 ==================== FUNCIONES PARA DOCUMENTOS ====================

  /**
   * Maneja la selección de documentos
   */
  onDocumentosSelect(event: any) {
    const files: FileList = event.target.files;
    
    if (!files || files.length === 0) return;

    // Validar cantidad máxima
    if (this.documentosAdjuntos.length + files.length > this.MAX_DOCUMENTOS) {
      this.mensajeError = `Solo puedes adjuntar hasta ${this.MAX_DOCUMENTOS} documentos`;
      this.tipoError = 'warning';
      setTimeout(() => this.mensajeError = '', 3000);
      return;
    }

    // Procesar cada archivo
    Array.from(files).forEach(file => {
      // Validar tipo de archivo
      if (!this.esArchivoPermitido(file)) {
        this.mensajeError = `Archivo no permitido: ${file.name}. Solo PDF, Word, Excel, PowerPoint, ZIP, RAR, CSV, TXT`;
        this.tipoError = 'warning';
        setTimeout(() => this.mensajeError = '', 4000);
        return;
      }

      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.mensajeError = `El archivo ${file.name} supera los 10MB`;
        this.tipoError = 'warning';
        setTimeout(() => this.mensajeError = '', 3000);
        return;
      }

      const { icono, color } = this.obtenerIconoYColor(file.type);

      const documento: DocumentoAdjunto = {
        file,
        preview: URL.createObjectURL(file),
        icono,
        color,
        nombre: file.name
      };

      this.documentosAdjuntos.push(documento);
    });

    // Resetear input
    event.target.value = '';
  }

  /**
   * Elimina un documento de la lista
   */
  eliminarDocumento(index: number) {
    // Liberar URL del preview
    URL.revokeObjectURL(this.documentosAdjuntos[index].preview);
    this.documentosAdjuntos.splice(index, 1);
  }

  /**
   * Valida si el tipo de archivo es permitido
   */
  private esArchivoPermitido(file: File): boolean {
    const tiposPermitidos = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed',
      'text/csv',
      'text/plain'
    ];

    return tiposPermitidos.includes(file.type);
  }

  /**
   * Obtiene el icono y color según el tipo de archivo
   */
  private obtenerIconoYColor(tipo: string): { icono: string; color: string } {
    const mapa: { [key: string]: { icono: string; color: string } } = {
      'application/pdf': { icono: 'fa-file-pdf', color: 'text-red-500' },
      'application/msword': { icono: 'fa-file-word', color: 'text-blue-500' },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icono: 'fa-file-word', color: 'text-blue-500' },
      'application/vnd.ms-excel': { icono: 'fa-file-excel', color: 'text-green-500' },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icono: 'fa-file-excel', color: 'text-green-500' },
      'application/vnd.ms-powerpoint': { icono: 'fa-file-powerpoint', color: 'text-orange-500' },
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icono: 'fa-file-powerpoint', color: 'text-orange-500' },
      'application/zip': { icono: 'fa-file-archive', color: 'text-purple-500' },
      'application/x-rar-compressed': { icono: 'fa-file-archive', color: 'text-purple-500' },
      'text/csv': { icono: 'fa-file-csv', color: 'text-yellow-500' },
      'text/plain': { icono: 'fa-file-code', color: 'text-indigo-500' }
    };

    return mapa[tipo] || { icono: 'fa-file', color: 'text-gray-500' };
  }

  /**
   * Formatea el tamaño del archivo
   */
  formatearTamano(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Verifica si se puede agregar más documentos
   */
  get puedeAgregarDocumentos(): boolean {
    return this.documentosAdjuntos.length < this.MAX_DOCUMENTOS;
  }

  // 🆕 ==================== FIN FUNCIONES DOCUMENTOS ====================

  /**
   * 📝 Publicar post con imagen y documentos
   */
 publicarPost() {
  if (!this.postContent.trim()) {
    return;
  }

  this.publicando = true;
  this.mensajeError = '';
  this.tipoError = 'error';

  // Crear FormData con contenido, categoría, imagen y documentos
  const formData = new FormData();
  formData.append('contenido', this.postContent.trim());
  formData.append('categoria', this.categoriaSeleccionada);

  // Agregar imagen si existe
  if (this.selectedFile) {
    formData.append('imagen', this.selectedFile);
  }

  // Agregar documentos
  this.documentosAdjuntos.forEach(doc => {
    formData.append('documentos', doc.file);
  });

  console.log('📤 Enviando publicación con:', {
    contenido: this.postContent.trim(),
    categoria: this.categoriaSeleccionada,
    tieneImagen: !!this.selectedFile,
    cantidadDocumentos: this.documentosAdjuntos.length
  });

  this.publicacionesService.crearPublicacion(formData).subscribe({
    next: (response) => {
      console.log('✅ Publicación creada exitosamente', response);

      // Si hay advertencia (requiere revisión)
      if (response.data?.advertencia) {
        this.tipoError = 'warning';
        this.mensajeError = `⚠️ ${response.data.advertencia}`;
        console.warn('⚠️ Advertencia:', response.data.advertencia);
      }

      // 🆕 NUEVO: Emitir la publicación completa hacia el padre
      if (response.data) {
        console.log('📤 Emitiendo publicación hacia Navbar:', response.data);
        this.publicacionCreada.emit(response.data);
      }

      // Resetear formulario
      this.postContent = '';
      this.selectedImage = null;
      this.selectedFile = null;
      this.documentosAdjuntos.forEach(doc => URL.revokeObjectURL(doc.preview));
      this.documentosAdjuntos = [];
      this.mostrarEmojiPicker = false;
      this.mostrarSelectorCategoria = false;
      this.categoriaSeleccionada = 'General';
      this.publicando = false;

      document.body.classList.remove('emoji-picker-open');

      // Emitir evento de éxito (para mantener compatibilidad)
      this.postCreado.emit();
      
      // Cerrar modal después de 1.5 segundos si no hay advertencia
      if (!response.data?.advertencia) {
        setTimeout(() => this.closeModal(), 1500);
      }
    },
    error: (error) => {
      console.error('❌ Error al crear publicación:', error);

      // Manejo de error de censura (403)
      if (this.publicacionesService.esErrorCensura(error)) {
        this.tipoError = 'censura';
        this.mensajeError = this.publicacionesService.extraerMensajeCensura(error);
        
        // Mostrar detalles específicos de la censura
        if (error.errors?.detalles) {
          console.error('📋 Detalles de censura:', {
            contenido: error.errors.detalles.contenido,
            imagen: error.errors.detalles.imagen
          });
        }
      } else {
        this.tipoError = 'error';
        this.mensajeError = error.error?.message || 'Error al publicar. Intenta de nuevo.';
      }

      this.publicando = false;
    }
  });
}

  /**
   * 🎨 Obtener clase CSS según el tipo de error
   */
  get errorAlertClass(): string {
    switch (this.tipoError) {
      case 'censura':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'error':
      default:
        return 'bg-red-50 border-red-200 text-red-700';
    }
  }

  /**
   * 🎨 Obtener icono según el tipo de error
   */
  get errorIcon(): string {
    switch (this.tipoError) {
      case 'censura':
        return '🚫';
      case 'warning':
        return '⚠️';
      case 'error':
      default:
        return '❌';
    }
  }
}
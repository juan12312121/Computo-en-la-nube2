import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

// ==================== INTERFACES ====================

export interface Publicacion {
  id: number;
  usuario_id: number;
  contenido: string;
  imagen_url?: string;
  imagen_s3?: string;
  categoria?: string;
  color_categoria?: string;
  visibilidad?: 'publico' | 'privado' | 'seguidores';
  nombre_usuario?: string;
  nombre_completo?: string;
  foto_perfil_url?: string;
  fecha_creacion: string;
  oculto: number;
  requiere_revision?: number;
  analisis_censura?: any;
  advertencia?: string;
  
  // ✅ PROPIEDADES DE LIKES
  total_likes?: number;           // Total de likes que tiene la publicación
  usuario_dio_like?: boolean;     // Si el usuario actual dio like
  likes?: number;                 // Alias de total_likes (para compatibilidad)
  liked?: boolean;                // Alias de usuario_dio_like
  
  // ✅ PROPIEDADES DE COMENTARIOS
  total_comentarios?: number;     // Total de comentarios
  comentarios?: number;           // Alias de total_comentarios
  
  // ✅ PROPIEDADES DE DOCUMENTOS
  documentos?: Documento[];
}

export interface Documento {
  id: number;
  usuario_id: number;
  publicacion_id: number;
  documento_s3: string;
  nombre_archivo: string;
  tamano_archivo: number;
  tipo_archivo: string;
  icono: string;
  color: string;
  fecha_creacion: string;
}

export interface Categoria {
  value: string;
  label: string;
  color: string;
}

export interface Visibilidad {
  value: 'publico' | 'privado' | 'seguidores';
  label: string;
  description: string;
  icono?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  mensaje?: string;
  errors?: any;
}

export interface ErrorCensura {
  motivo: string;
  detalles?: {
    contenido: string[];
    imagen: string[];
  };
}

// ==================== SERVICIO ====================

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    const host = window.location.hostname;
    this.apiUrl = host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:3000/api/publicaciones'
      : 'http://3.146.83.30:3000/api/publicaciones';
    
    console.log('🔧 PublicacionesService inicializado');
    console.log('📍 API URL:', this.apiUrl);
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Construir headers con token de autenticación
   */
  private getHeaders(): { headers?: HttpHeaders } {
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log('🔑 Token encontrado, agregando a headers');
      return { 
        headers: new HttpHeaders({ 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }) 
      };
    }
    
    console.log('⚠️ No hay token, request sin autenticación');
    return {};
  }

  // ==================== MÉTODOS PÚBLICOS - CATEGORÍAS ====================

  /**
   * Obtener categorías disponibles
   * GET /api/publicaciones/categorias
   */
  obtenerCategorias(): Observable<ApiResponse<Categoria[]>> {
    console.log('📂 Obteniendo categorías...');
    return this.http.get<ApiResponse<Categoria[]>>(`${this.apiUrl}/categorias`).pipe(
      tap(response => console.log('✅ Categorías obtenidas:', response)),
      catchError(error => {
        console.error('❌ Error al obtener categorías:', error);
        return of({
          success: true,
          data: this.getCategoriasDefault(),
          message: 'Categorías por defecto'
        });
      })
    );
  }

  // ==================== MÉTODOS PÚBLICOS - VISIBILIDAD ====================

  /**
   * Obtener opciones de visibilidad disponibles
   * GET /api/publicaciones/visibilidades
   */
  obtenerVisibilidades(): Observable<ApiResponse<Visibilidad[]>> {
    console.log('🔒 Obteniendo opciones de visibilidad...');
    return this.http.get<ApiResponse<Visibilidad[]>>(`${this.apiUrl}/visibilidades`).pipe(
      tap(response => console.log('✅ Visibilidades obtenidas:', response)),
      catchError(error => {
        console.error('❌ Error al obtener visibilidades:', error);
        return of({
          success: true,
          data: this.getVisibilidadesDefault(),
          message: 'Visibilidades por defecto'
        });
      })
    );
  }

  // ==================== MÉTODOS PÚBLICOS - CRUD PUBLICACIONES ====================

  /**
   * Crear publicación (con validación de censura y visibilidad)
   * POST /api/publicaciones
   * 
   * Retorna:
   * - 201: Publicación creada exitosamente
   * - 403: Contenido rechazado por censura
   * - 400: Validación fallida
   */
  crearPublicacion(publicacion: FormData): Observable<ApiResponse<Publicacion>> {
    console.log('📝 Creando publicación...');
    
    const token = localStorage.getItem('token');
    const headers = token ? { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) } : {};
    
    return this.http.post<ApiResponse<Publicacion>>(this.apiUrl, publicacion, headers).pipe(
      tap(response => {
        console.log('✅ Publicación creada:', response);
        if (response.data?.advertencia) {
          console.warn('⚠️ Advertencia:', response.data.advertencia);
        }
      }),
      catchError(error => {
        if (error.status === 403) {
          console.error('❌ Contenido rechazado por censura:', error.error);
          const errorCensura: ErrorCensura = error.error.errors || {
            motivo: error.error.message || 'Tu publicación contiene contenido inapropiado'
          };
          
          const respuestaError: ApiResponse<any> = {
            success: false,
            data: null,
            message: `CENSURA: ${errorCensura.motivo}`,
            errors: errorCensura
          };
          
          throw respuestaError;
        }
        
        console.error('❌ Error al crear publicación:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener publicaciones (feed general)
   * GET /api/publicaciones
   * 
   * Usuario autenticado: ve públicas + propias + de seguidores (según visibilidad)
   * Usuario no autenticado: solo ve públicas
   */
  obtenerPublicaciones(): Observable<ApiResponse<Publicacion[]>> {
    console.log('🔄 Obteniendo publicaciones...');
    console.log('📡 URL:', this.apiUrl);
    
    const headers = this.getHeaders();
    console.log('📤 Headers:', headers);
    
    return this.http.get<ApiResponse<Publicacion[]>>(this.apiUrl, headers).pipe(
      tap(response => {
        console.log('✅ Respuesta recibida:', {
          success: response.success,
          cantidad: response.data?.length || 0,
          mensaje: response.message || response.mensaje
        });
      }),
      catchError(error => {
        console.error('❌ Error al obtener publicaciones:', {
          status: error.status,
          statusText: error.statusText,
          mensaje: error.error?.mensaje || error.message,
          url: error.url
        });
        
        return of({
          success: false,
          data: [],
          message: error.error?.mensaje || 'Error al cargar publicaciones'
        });
      })
    );
  }

  /**
   * Obtener una publicación por ID (respetando visibilidad)
   * GET /api/publicaciones/:id
   */
  obtenerPublicacion(id: number): Observable<ApiResponse<Publicacion>> {
    console.log('🔍 Obteniendo publicación ID:', id);
    return this.http.get<ApiResponse<Publicacion>>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      tap(response => console.log('✅ Publicación obtenida:', response)),
      catchError(error => {
        console.error('❌ Error al obtener publicación:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener mis publicaciones (incluyendo privadas)
   * GET /api/publicaciones/mis-publicaciones
   */
  obtenerMisPublicaciones(): Observable<ApiResponse<Publicacion[]>> {
    console.log('👤 Obteniendo mis publicaciones...');
    return this.http.get<ApiResponse<Publicacion[]>>(`${this.apiUrl}/mis-publicaciones`, this.getHeaders()).pipe(
      tap(response => console.log('✅ Mis publicaciones:', response.data?.length || 0)),
      catchError(error => {
        console.error('❌ Error al obtener mis publicaciones:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener publicaciones de otro usuario (respetando visibilidad)
   * GET /api/publicaciones/usuario/:usuarioId
   */
  obtenerPublicacionesUsuario(usuarioId: number): Observable<ApiResponse<Publicacion[]>> {
    console.log('👥 Obteniendo publicaciones del usuario:', usuarioId);
    return this.http.get<ApiResponse<Publicacion[]>>(`${this.apiUrl}/usuario/${usuarioId}`, this.getHeaders()).pipe(
      tap(response => console.log('✅ Publicaciones del usuario:', response.data?.length || 0)),
      catchError(error => {
        console.error('❌ Error al obtener publicaciones del usuario:', error);
        throw error;
      })
    );
  }

  /**
   * Actualizar publicación (con validación de censura y visibilidad)
   * PUT /api/publicaciones/:id
   * 
   * Retorna:
   * - 200: Publicación actualizada
   * - 403: Contenido rechazado por censura
   */
  actualizarPublicacion(id: number, publicacion: FormData): Observable<ApiResponse<Publicacion>> {
    console.log('✏️ Actualizando publicación ID:', id);
    
    const token = localStorage.getItem('token');
    const headers = token ? { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) } : {};
    
    return this.http.put<ApiResponse<Publicacion>>(`${this.apiUrl}/${id}`, publicacion, headers).pipe(
      tap(response => console.log('✅ Publicación actualizada:', response)),
      catchError(error => {
        if (error.status === 403) {
          console.error('❌ Contenido actualizado rechazado por censura:', error.error);
          const errorCensura: ErrorCensura = error.error.errors || {
            motivo: error.error.message || 'Tu contenido actualizado es inapropiado'
          };
          
          const respuestaError: ApiResponse<any> = {
            success: false,
            data: null,
            message: `CENSURA: ${errorCensura.motivo}`,
            errors: errorCensura
          };
          
          throw respuestaError;
        }
        
        console.error('❌ Error al actualizar publicación:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar publicación
   * DELETE /api/publicaciones/:id
   */
  eliminarPublicacion(id: number): Observable<ApiResponse<null>> {
    console.log('🗑️ Eliminando publicación ID:', id);
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      tap(response => console.log('✅ Publicación eliminada:', response)),
      catchError(error => {
        console.error('❌ Error al eliminar publicación:', error);
        throw error;
      })
    );
  }

  // ==================== HELPERS - FORMDATA ====================

  /**
   * Crear FormData para publicación (con visibilidad y documentos)
   */
  crearFormData(datos: {
    contenido: string;
    categoria?: string;
    visibilidad?: 'publico' | 'privado' | 'seguidores';
    imagen?: File;
    documentos?: File[];
  }): FormData {
    const formData = new FormData();
    formData.append('contenido', datos.contenido);
    if (datos.categoria) formData.append('categoria', datos.categoria);
    if (datos.visibilidad) formData.append('visibilidad', datos.visibilidad);
    if (datos.imagen) formData.append('imagen', datos.imagen);
    
    // Agregar documentos (hasta 5)
    if (datos.documentos && datos.documentos.length > 0) {
      datos.documentos.forEach((doc) => {
        formData.append('documentos', doc);
      });
    }
    
    console.log('📦 FormData creado:', {
      contenido: datos.contenido.substring(0, 50) + '...',
      categoria: datos.categoria,
      visibilidad: datos.visibilidad || 'publico',
      tieneImagen: !!datos.imagen,
      documentos: datos.documentos?.length || 0
    });
    
    return formData;
  }

  // ==================== HELPERS - CATEGORÍAS ====================

  /**
   * Obtener el color de una categoría
   */
  obtenerColorCategoria(categoria: string): string {
    const colores: { [key: string]: string } = {
      'General': 'bg-orange-500',
      'Tecnología': 'bg-teal-500',
      'Ciencias': 'bg-purple-500',
      'Artes y Cultura': 'bg-pink-500',
      'Deportes': 'bg-blue-500',
      'Salud y Bienestar': 'bg-green-500',
      'Vida Universitaria': 'bg-orange-600',
      'Opinión': 'bg-indigo-500',
      'Entrevistas': 'bg-yellow-500'
    };
    return colores[categoria] || 'bg-orange-500';
  }

  /**
   * Categorías por defecto
   */
  private getCategoriasDefault(): Categoria[] {
    return [
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

  // ==================== HELPERS - VISIBILIDAD ====================

  /**
   * Obtener el icono de visibilidad
   */
  obtenerIconoVisibilidad(visibilidad: string): string {
    const iconos: { [key: string]: string } = {
      'publico': '🌍',
      'privado': '🔒',
      'seguidores': '👥'
    };
    return iconos[visibilidad] || '🌍';
  }

  /**
   * Obtener el label de visibilidad
   */
  obtenerLabelVisibilidad(visibilidad: string): string {
    const labels: { [key: string]: string } = {
      'publico': 'Público',
      'privado': 'Privado',
      'seguidores': 'Solo seguidores'
    };
    return labels[visibilidad] || 'Público';
  }

  /**
   * Verificar si puedo editar visibilidad
   */
  puedeEditarVisibilidad(publicacion: Publicacion, usuarioActualId: number): boolean {
    return publicacion.usuario_id === usuarioActualId;
  }

  /**
   * Visibilidades por defecto
   */
  private getVisibilidadesDefault(): Visibilidad[] {
    return [
      { 
        value: 'publico', 
        label: '🌍 Público', 
        description: 'Todos pueden ver esta publicación',
        icono: '🌍'
      },
      { 
        value: 'seguidores', 
        label: '👥 Solo seguidores', 
        description: 'Solo tus seguidores pueden verla',
        icono: '👥'
      },
      { 
        value: 'privado', 
        label: '🔒 Privado', 
        description: 'Solo tú puedes verla',
        icono: '🔒'
      }
    ];
  }

  // ==================== HELPERS - CENSURA ====================

  /**
   * Extraer mensaje de error de censura
   */
  extraerMensajeCensura(error: any): string {
    if (error.message?.includes('CENSURA:')) {
      return error.message;
    }
    
    if (error.errors?.motivo) {
      return `CENSURA: ${error.errors.motivo}`;
    }
    
    return 'Tu publicación contiene contenido inapropiado';
  }

  /**
   * Verificar si es error de censura
   */
  esErrorCensura(error: any): boolean {
    return error?.message?.includes('CENSURA:') || 
           error?.errors?.motivo !== undefined ||
           error?.message?.includes('inapropiado');
  }

  // ==================== HELPERS - CONEXIÓN ====================

  /**
   * Verificar conectividad con backend
   */
  verificarConexion(): Observable<boolean> {
    console.log('🔌 Verificando conexión con backend...');
    return this.http.get<ApiResponse<Categoria[]>>(`${this.apiUrl}/categorias`).pipe(
      tap(() => console.log('✅ Backend accesible')),
      catchError(error => {
        console.error('❌ Backend no accesible:', error);
        return of(false as any);
      })
    ) as Observable<boolean>;
  }
}
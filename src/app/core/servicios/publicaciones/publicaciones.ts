import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';

// Interfaces
export interface Publicacion {
  id: number;
  usuario_id: number;
  contenido: string;
  imagen_url?: string;
  imagen_s3?: string;
  categoria?: string;
  color_categoria?: string;
  nombre_usuario?: string;
  nombre_completo?: string;
  foto_perfil_url?: string;
  fecha_creacion: string;
  oculto: number;
}

export interface Categoria {
  value: string;
  label: string;
  color: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  mensaje?: string; // Para compatibilidad con backend
}

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    const host = window.location.hostname;
    this.apiUrl = host === 'localhost' || host === '127.0.0.1'
      ? 'http://localhost:3000/api/publicaciones'
      : 'http://13.59.190.199:3000/api/publicaciones';
    
    console.log('🔧 PublicacionesService inicializado');
    console.log('📍 API URL:', this.apiUrl);
  }

  // Construir headers con token
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

  // ✅ Obtener categorías disponibles
  obtenerCategorias(): Observable<ApiResponse<Categoria[]>> {
    console.log('📂 Obteniendo categorías...');
    return this.http.get<ApiResponse<Categoria[]>>(`${this.apiUrl}/categorias`).pipe(
      tap(response => console.log('✅ Categorías obtenidas:', response)),
      catchError(error => {
        console.error('❌ Error al obtener categorías:', error);
        // Devolver categorías por defecto si falla
        return of({
          success: true,
          data: this.getCategoriasDefault(),
          message: 'Categorías por defecto'
        });
      })
    );
  }

  // Crear publicación
  crearPublicacion(publicacion: FormData): Observable<ApiResponse<Publicacion>> {
    console.log('📝 Creando publicación...');
    
    // Para FormData no usar Content-Type en headers
    const token = localStorage.getItem('token');
    const headers = token ? { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) } : {};
    
    return this.http.post<ApiResponse<Publicacion>>(this.apiUrl, publicacion, headers).pipe(
      tap(response => console.log('✅ Publicación creada:', response)),
      catchError(error => {
        console.error('❌ Error al crear publicación:', error);
        throw error;
      })
    );
  }

  // Obtener feed general - CON MEJOR MANEJO DE ERRORES
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
        
        // En lugar de fallar, devolver respuesta vacía para que el componente maneje
        return of({
          success: false,
          data: [],
          message: error.error?.mensaje || 'Error al cargar publicaciones'
        });
      })
    );
  }

  // Obtener publicación por ID
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

  // Obtener mis publicaciones
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

  // Obtener publicaciones de otro usuario
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

  // Actualizar publicación
  actualizarPublicacion(id: number, publicacion: FormData): Observable<ApiResponse<Publicacion>> {
    console.log('✏️ Actualizando publicación ID:', id);
    
    const token = localStorage.getItem('token');
    const headers = token ? { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) } : {};
    
    return this.http.put<ApiResponse<Publicacion>>(`${this.apiUrl}/${id}`, publicacion, headers).pipe(
      tap(response => console.log('✅ Publicación actualizada:', response)),
      catchError(error => {
        console.error('❌ Error al actualizar publicación:', error);
        throw error;
      })
    );
  }

  // Eliminar publicación
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

  // Helper: Crear FormData
  crearFormData(datos: {
    contenido: string;
    categoria?: string;
    imagen?: File;
  }): FormData {
    const formData = new FormData();
    formData.append('contenido', datos.contenido);
    if (datos.categoria) formData.append('categoria', datos.categoria);
    if (datos.imagen) formData.append('imagen', datos.imagen);
    
    console.log('📦 FormData creado:', {
      contenido: datos.contenido.substring(0, 50) + '...',
      categoria: datos.categoria,
      tieneImagen: !!datos.imagen
    });
    
    return formData;
  }

  // Helper: Obtener el color de una categoría
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

  // Helper privado: Categorías por defecto
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

  // Helper: Verificar conectividad con el backend
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
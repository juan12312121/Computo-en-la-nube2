import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

interface Photo {
  id: number | string;
  url: string;
  caption: string;
  postId?: number;
  tipo: 'perfil' | 'portada' | 'publicacion';
  fecha?: string | null;
}

interface FotoHistorial {
  nombre: string;
  url: string;
  fecha: string;
  tamaño: number;
  tipo: 'perfil' | 'portada';
  es_actual: boolean;
  formato: string;
}

interface FotoPublicacion {
  id: number;
  url: string;
  descripcion: string;
  fecha: string;
  tipo: 'publicacion';
}

interface BackendResponse {
  success: boolean;
  data: {
    usuario: {
      nombre_completo: string;
      nombre_usuario: string;
    };
    fotos: {
      perfil_actual?: {
        url: string;
        tipo: 'perfil';
        es_actual: boolean;
      };
      portada_actual?: {
        url: string;
        tipo: 'portada';
        es_actual: boolean;
      };
      perfil_historial: FotoHistorial[];
      portada_historial: FotoHistorial[];
      publicaciones: FotoPublicacion[];
    };
    estadisticas: {
      total_fotos: number;
      fotos_perfil_total: number;
      fotos_portada_total: number;
      fotos_publicaciones: number;
    };
  };
}

interface FotoPerfilSimpleResponse {
  success: boolean;
  data: {
    id: number;
    nombre_completo: string;
    nombre_usuario: string;
    foto_perfil_url: string | null;
  };
}

interface FotosBatchResponse {
  success: boolean;
  data: Array<{
    id: number;
    nombre_completo: string;
    nombre_usuario: string;
    foto_perfil_url: string | null;
  }>;
}

import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FotosService {
  // ✅ DINÁMICO
  private readonly apiUrl = environment.apiUrl + '/fotos';
  private readonly BASE_URL = environment.socketUrl;

  constructor(private http: HttpClient) {
    console.log('📸 FotosService inicializado');
    console.log('📍 API URL (LOCAL):', this.apiUrl);
    console.log('🏠 BASE URL:', this.BASE_URL);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * ✅ MEJORADO: Formatear URLs para almacenamiento LOCAL
   * Normaliza todas las URLs para que apunten a localhost
   */
  private formatearUrlLocal(url: string, tipo: 'perfil' | 'portada' | 'publicacion'): string {
    if (!url) return '';

    console.log('🔧 Formateando URL:', { url, tipo });

    // Si ya es una URL completa (localhost o externa como S3), retornarla
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // console.log('✅ URL ya es completa:', url);
      return url;
    }

    // Determinar carpeta según tipo
    const carpeta =
      tipo === 'perfil' ? 'perfiles' :
        tipo === 'portada' ? 'portadas' :
          'publicaciones';

    // Si es una ruta relativa que empieza con /uploads/
    if (url.startsWith('/uploads/')) {
      const urlFinal = `${this.BASE_URL}${url}`;
      console.log('✅ Construida desde /uploads/:', urlFinal);
      return urlFinal;
    }

    // Si solo viene el nombre del archivo
    if (!url.startsWith('http') && !url.startsWith('/')) {
      const urlFinal = `${this.BASE_URL}/uploads/${carpeta}/${url}`;
      console.log('✅ Construida desde nombre:', urlFinal);
      return urlFinal;
    }

    // Si viene una ruta parcial
    if (url.includes('/perfiles/') || url.includes('/portadas/') || url.includes('/publicaciones/')) {
      const urlFinal = url.startsWith('/') ? `${this.BASE_URL}${url}` : `${this.BASE_URL}/${url}`;
      console.log('✅ Construida desde ruta parcial:', urlFinal);
      return urlFinal;
    }

    console.warn('⚠️ URL no reconocida, retornando original:', url);
    return url;
  }

  // ========== MÉTODOS PARA OBTENER FOTOS ==========

  obtenerMisFotos(): Observable<Photo[]> {
    console.log('========================================');
    console.log('📸 SOLICITANDO MIS FOTOS');
    console.log('========================================');
    console.log('🌐 URL:', `${this.apiUrl}/mis-fotos`);

    return this.http.get<BackendResponse>(`${this.apiUrl}/mis-fotos`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('========================================');
        console.log('✅ RESPUESTA CRUDA DEL BACKEND');
        console.log('========================================');
        console.log('📦 Respuesta completa:', response);
        console.log('✔️ Success:', response.success);
        console.log('📊 Data:', response.data);
        console.log('📸 Fotos perfil historial:', response.data.fotos.perfil_historial.length);
        console.log('🖼️ Fotos portada historial:', response.data.fotos.portada_historial.length);
        console.log('📷 Publicaciones:', response.data.fotos.publicaciones.length);
      }),
      map(response => this.transformarFotos(response))
    );
  }

  obtenerFotosUsuario(userId: number): Observable<Photo[]> {
    console.log('========================================');
    console.log('📸 SOLICITANDO FOTOS DE USUARIO:', userId);
    console.log('========================================');
    console.log('🌐 URL:', `${this.apiUrl}/usuario/${userId}`);

    return this.http.get<BackendResponse>(`${this.apiUrl}/usuario/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        console.log('========================================');
        console.log('✅ RESPUESTA CRUDA DEL BACKEND');
        console.log('========================================');
        console.log('📦 Respuesta completa:', response);
        console.log('✔️ Success:', response.success);
        console.log('📊 Data:', response.data);
        console.log('📸 Fotos perfil historial:', response.data.fotos.perfil_historial.length);
        console.log('🖼️ Fotos portada historial:', response.data.fotos.portada_historial.length);
        console.log('📷 Publicaciones:', response.data.fotos.publicaciones.length);
      }),
      map(response => this.transformarFotos(response))
    );
  }

  private transformarFotos(response: BackendResponse): Photo[] {
    const fotos: Photo[] = [];

    // Mapear fotos de perfil del historial con URLs locales
    if (response.data?.fotos?.perfil_historial && Array.isArray(response.data.fotos.perfil_historial)) {
      const fotosPerfil = response.data.fotos.perfil_historial.map((foto, index) => {
        const urlLocal = this.formatearUrlLocal(foto.url, 'perfil');
        console.log('🔄 Transformando foto de perfil:', {
          original: foto.url,
          local: urlLocal
        });

        return {
          id: `perfil-${foto.nombre}-${index}`,
          url: urlLocal,
          caption: foto.es_actual ? 'Foto de perfil actual' : 'Foto de perfil anterior',
          tipo: 'perfil' as const,
          fecha: foto.fecha
        };
      });
      fotos.push(...fotosPerfil);
    }

    // Mapear fotos de portada del historial con URLs locales
    if (response.data?.fotos?.portada_historial && Array.isArray(response.data.fotos.portada_historial)) {
      const fotosPortada = response.data.fotos.portada_historial.map((foto, index) => {
        const urlLocal = this.formatearUrlLocal(foto.url, 'portada');
        console.log('🔄 Transformando foto de portada:', {
          original: foto.url,
          local: urlLocal
        });

        return {
          id: `portada-${foto.nombre}-${index}`,
          url: urlLocal,
          caption: foto.es_actual ? 'Foto de portada actual' : 'Foto de portada anterior',
          tipo: 'portada' as const,
          fecha: foto.fecha
        };
      });
      fotos.push(...fotosPortada);
    }

    // Mapear fotos de publicaciones con URLs locales
    if (response.data?.fotos?.publicaciones && Array.isArray(response.data.fotos.publicaciones)) {
      const fotosPublicaciones = response.data.fotos.publicaciones.map(pub => {
        const urlLocal = this.formatearUrlLocal(pub.url, 'publicacion');
        console.log('🔄 Transformando foto de publicación:', {
          original: pub.url,
          local: urlLocal
        });

        return {
          id: pub.id,
          url: urlLocal,
          caption: pub.descripcion,
          postId: pub.id,
          tipo: 'publicacion' as const,
          fecha: pub.fecha
        };
      });
      fotos.push(...fotosPublicaciones);
    }

    console.log('========================================');
    console.log('🔄 DATOS TRANSFORMADOS PARA EL COMPONENTE');
    console.log('========================================');
    console.log('📊 Total de fotos transformadas:', fotos.length);
    console.log('👤 Fotos de perfil:', fotos.filter(f => f.tipo === 'perfil').length);
    console.log('🖼️ Fotos de portada:', fotos.filter(f => f.tipo === 'portada').length);
    console.log('📷 Fotos de publicaciones:', fotos.filter(f => f.tipo === 'publicacion').length);
    console.log('📋 Primeras 3 URLs:', fotos.slice(0, 3).map(f => ({
      tipo: f.tipo,
      url: f.url
    })));
    console.log('========================================');

    return fotos;
  }

  // ========== MÉTODOS PARA COMENTARIOS ==========

  /**
   * Obtiene la foto de perfil de un usuario específico
   * Endpoint: GET /api/fotos/usuario/:usuario_id/foto-perfil-simple
   */
  obtenerFotoPerfil(usuarioId: number): Observable<FotoPerfilSimpleResponse> {
    console.log('📸 [obtenerFotoPerfil] Solicitando foto del usuario:', usuarioId);

    return this.http.get<FotoPerfilSimpleResponse>(
      `${this.apiUrl}/usuario/${usuarioId}/foto-perfil-simple`
    ).pipe(
      tap(response => {
        console.log('📦 [obtenerFotoPerfil] Respuesta raw:', {
          success: response.success,
          usuario: response.data?.nombre_completo,
          foto_url_original: response.data?.foto_perfil_url
        });
      }),
      map(response => {
        // Aplicar formateo a la URL local
        if (response.success && response.data && response.data.foto_perfil_url) {
          const urlOriginal = response.data.foto_perfil_url;
          const urlFormateada = this.formatearUrlLocal(urlOriginal, 'perfil');

          console.log('✅ [obtenerFotoPerfil] URL formateada:', {
            usuario_id: usuarioId,
            nombre: response.data.nombre_completo,
            url_original: urlOriginal,
            url_formateada: urlFormateada
          });

          return {
            ...response,
            data: {
              ...response.data,
              foto_perfil_url: urlFormateada
            }
          };
        }

        console.log('⚠️ [obtenerFotoPerfil] Usuario sin foto:', usuarioId);
        return response;
      })
    );
  }

  /**
   * Obtiene fotos de perfil de múltiples usuarios en una sola petición
   * Endpoint: POST /api/fotos/usuarios/fotos-batch
   * @param usuariosIds Array de IDs de usuarios (máx 50)
   */
  obtenerFotosBatch(usuariosIds: number[]): Observable<FotosBatchResponse> {
    console.log('📸 [obtenerFotosBatch] Solicitando fotos de', usuariosIds.length, 'usuarios');

    // Validación: limitar a 50 usuarios
    const idsLimitados = usuariosIds.slice(0, 50);

    if (idsLimitados.length !== usuariosIds.length) {
      console.warn('⚠️ [obtenerFotosBatch] IDs limitados de', usuariosIds.length, 'a', idsLimitados.length);
    }

    return this.http.post<FotosBatchResponse>(
      `${this.apiUrl}/usuarios/fotos-batch`,
      { usuarios_ids: idsLimitados }
    ).pipe(
      tap(response => {
        console.log('📦 [obtenerFotosBatch] Respuesta raw:', {
          success: response.success,
          solicitados: idsLimitados.length,
          recibidos: response.data?.length || 0,
          con_foto: response.data?.filter(u => u.foto_perfil_url).length || 0
        });
      }),
      map(response => {
        // Aplicar formateo a todas las URLs locales
        if (response.success && response.data && Array.isArray(response.data)) {
          console.log('🔧 [obtenerFotosBatch] Formateando URLs a localhost...');

          const dataFormateada = response.data.map(usuario => {
            if (usuario.foto_perfil_url) {
              const urlOriginal = usuario.foto_perfil_url;
              const urlFormateada = this.formatearUrlLocal(urlOriginal, 'perfil');

              console.log(`✅ Usuario ${usuario.id} (${usuario.nombre_completo}):`, {
                url_original: urlOriginal,
                url_formateada: urlFormateada
              });

              return {
                ...usuario,
                foto_perfil_url: urlFormateada
              };
            }

            console.log(`⚠️ Usuario ${usuario.id} (${usuario.nombre_completo}): Sin foto`);
            return usuario;
          });

          console.log('✅ [obtenerFotosBatch] Formateo completado:', {
            total: dataFormateada.length,
            con_foto: dataFormateada.filter(u => u.foto_perfil_url).length
          });

          return {
            ...response,
            data: dataFormateada
          };
        }

        return response;
      })
    );
  }
}

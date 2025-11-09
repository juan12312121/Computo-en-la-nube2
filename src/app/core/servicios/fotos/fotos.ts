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

@Injectable({
  providedIn: 'root'
})
export class FotosService {
  private apiUrl = 'http://3.146.83.30:3000/api/fotos';
  // 🆕 URL base de S3
  private readonly s3BaseUrl = 'https://redstudent-uploads.s3.us-east-2.amazonaws.com';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 🆕 Método para formatear URLs a S3
  private formatearUrlS3(url: string, tipo: 'perfil' | 'portada' | 'publicacion'): string {
    if (!url) return '';
    
    // Si ya apunta a S3, normalizarla por si tiene rutas incorrectas
    if (url.includes('s3.us-east-2.amazonaws.com') || url.includes('s3.amazonaws.com')) {
      // Corregir /perfiles/ a /perfil/ si existe
      return url.replace('/perfiles/', '/perfil/');
    }
    
    // Si es una URL del servidor API, extraer solo la ruta
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const match = url.match(/\/uploads\/.+$/);
      if (match) {
        // Corregir /perfiles/ a /perfil/ si existe
        const rutaCorregida = match[0].replace('/perfiles/', '/perfil/');
        return `${this.s3BaseUrl}${rutaCorregida}`;
      }
    }
    
    // Si es solo un nombre de archivo (sin ruta), construir la ruta según el tipo
    if (!url.includes('/') && !url.startsWith('uploads')) {
      let carpeta = 'publicaciones';
      
      if (tipo === 'perfil' || url.includes('foto_perfil') || url.includes('perfil')) {
        carpeta = 'perfil';
      } else if (tipo === 'portada' || url.includes('foto_portada') || url.includes('portada')) {
        carpeta = 'portadas';
      }
      
      return `${this.s3BaseUrl}/uploads/${carpeta}/${url}`;
    }
    
    // Si es una ruta relativa, construir URL completa
    const cleanPath = url.replace(/^\/+/, '').replace('/perfiles/', '/perfil/');
    return `${this.s3BaseUrl}/${cleanPath}`;
  }

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

    // 🆕 Mapear fotos de perfil del historial con URLs de S3
    if (response.data?.fotos?.perfil_historial && Array.isArray(response.data.fotos.perfil_historial)) {
      const fotosPerfil = response.data.fotos.perfil_historial.map((foto, index) => {
        const urlS3 = this.formatearUrlS3(foto.url, 'perfil');
        console.log('🔄 Transformando foto de perfil:', {
          original: foto.url,
          s3: urlS3
        });
        
        return {
          id: `perfil-${foto.nombre}-${index}`,
          url: urlS3,
          caption: foto.es_actual ? 'Foto de perfil actual' : 'Foto de perfil anterior',
          tipo: 'perfil' as const,
          fecha: foto.fecha
        };
      });
      fotos.push(...fotosPerfil);
    }

    // 🆕 Mapear fotos de portada del historial con URLs de S3
    if (response.data?.fotos?.portada_historial && Array.isArray(response.data.fotos.portada_historial)) {
      const fotosPortada = response.data.fotos.portada_historial.map((foto, index) => {
        const urlS3 = this.formatearUrlS3(foto.url, 'portada');
        console.log('🔄 Transformando foto de portada:', {
          original: foto.url,
          s3: urlS3
        });
        
        return {
          id: `portada-${foto.nombre}-${index}`,
          url: urlS3,
          caption: foto.es_actual ? 'Foto de portada actual' : 'Foto de portada anterior',
          tipo: 'portada' as const,
          fecha: foto.fecha
        };
      });
      fotos.push(...fotosPortada);
    }

    // 🆕 Mapear fotos de publicaciones con URLs de S3
    if (response.data?.fotos?.publicaciones && Array.isArray(response.data.fotos.publicaciones)) {
      const fotosPublicaciones = response.data.fotos.publicaciones.map(pub => {
        const urlS3 = this.formatearUrlS3(pub.url, 'publicacion');
        console.log('🔄 Transformando foto de publicación:', {
          original: pub.url,
          s3: urlS3
        });
        
        return {
          id: pub.id,
          url: urlS3,
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
}
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
  private apiUrl = 'http://13.59.190.199:3000/api/fotos';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
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

    // Mapear fotos de perfil del historial
    if (response.data?.fotos?.perfil_historial && Array.isArray(response.data.fotos.perfil_historial)) {
      const fotosPerfil = response.data.fotos.perfil_historial.map((foto, index) => ({
        id: `perfil-${foto.nombre}-${index}`,
        url: foto.url,
        caption: foto.es_actual ? 'Foto de perfil actual' : 'Foto de perfil anterior',
        tipo: 'perfil' as const,
        fecha: foto.fecha
      }));
      fotos.push(...fotosPerfil);
    }

    // Mapear fotos de portada del historial
    if (response.data?.fotos?.portada_historial && Array.isArray(response.data.fotos.portada_historial)) {
      const fotosPortada = response.data.fotos.portada_historial.map((foto, index) => ({
        id: `portada-${foto.nombre}-${index}`,
        url: foto.url,
        caption: foto.es_actual ? 'Foto de portada actual' : 'Foto de portada anterior',
        tipo: 'portada' as const,
        fecha: foto.fecha
      }));
      fotos.push(...fotosPortada);
    }

    // Mapear fotos de publicaciones
    if (response.data?.fotos?.publicaciones && Array.isArray(response.data.fotos.publicaciones)) {
      const fotosPublicaciones = response.data.fotos.publicaciones.map(pub => ({
        id: pub.id,
        url: pub.url,
        caption: pub.descripcion,
        postId: pub.id,
        tipo: 'publicacion' as const,
        fecha: pub.fecha
      }));
      fotos.push(...fotosPublicaciones);
    }

    console.log('========================================');
    console.log('🔄 DATOS TRANSFORMADOS PARA EL COMPONENTE');
    console.log('========================================');
    console.log('📊 Total de fotos transformadas:', fotos.length);
    console.log('👤 Fotos de perfil:', fotos.filter(f => f.tipo === 'perfil').length);
    console.log('🖼️ Fotos de portada:', fotos.filter(f => f.tipo === 'portada').length);
    console.log('📷 Fotos de publicaciones:', fotos.filter(f => f.tipo === 'publicacion').length);
    console.log('📋 Fotos completas:', fotos);
    console.log('========================================');

    return fotos;
  }
}
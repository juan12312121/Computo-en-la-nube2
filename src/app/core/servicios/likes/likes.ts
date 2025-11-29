import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AutenticacionService } from '../autenticacion/autenticacion';

@Injectable({
  providedIn: 'root'
})
export class LikesService {
  // ✅ URL CORRECTA - Puerto 3000 (backend)
  private apiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api/likes'
    : 'http://3.146.83.30:3000/api/likes';

  constructor(
    private http: HttpClient,
    private autenticacionService: AutenticacionService
  ) {}

  /**
   * Obtener headers con token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = this.autenticacionService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Verificar si el usuario actual ha dado like a una publicación
   */
  verificarLike(publicacionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/verificar/${publicacionId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Agregar o eliminar like automáticamente
   */
  toggleLike(publicacionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/toggle`, 
      { publicacion_id: publicacionId },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener todos los likes de una publicación
   */
  obtenerPorPublicacion(publicacionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/publicacion/${publicacionId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Dar like a una publicación
   */
  darLike(publicacionId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, 
      { publicacion_id: publicacionId },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Quitar like de una publicación
   */
  quitarLike(likeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${likeId}`, {
      headers: this.getHeaders()
    });
  }
}
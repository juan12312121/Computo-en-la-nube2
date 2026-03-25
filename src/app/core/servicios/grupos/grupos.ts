import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Grupo } from '../../modelos/grupo.model';
import { ApiResponse } from '../../modelos/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class GruposService {
    private apiUrl: string;

    constructor(private http: HttpClient) {
        this.apiUrl = environment.apiUrl + '/grupos';
    }

    private getHeaders(isMultipart: boolean = false): { headers?: HttpHeaders } {
        const token = localStorage.getItem('token');
        if (token) {
            let headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`
            });
            
            // 🔥 CLAVE: No poner Content-Type si es multipart (FormData)
            // El navegador lo pondrá automáticamente con el "boundary" correcto
            if (!isMultipart) {
                headers = headers.set('Content-Type', 'application/json');
            }
            
            return { headers };
        }
        return {};
    }

    private resolveUrl(url: string | null | undefined): string {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        // Si es una ruta relativa de uploads, le ponemos el prefijo del servidor
        if (url.startsWith('/uploads')) {
            return `${environment.socketUrl}${url}`;
        }
        return url;
    }

    private mapGrupo(grupo: Grupo): Grupo {
        return {
            ...grupo,
            imagen_url: this.resolveUrl(grupo.imagen_url),
            imagen_portada_url: this.resolveUrl(grupo.imagen_portada_url)
        };
    }

    listarGrupos(): Observable<ApiResponse<Grupo[]>> {
        return this.http.get<ApiResponse<Grupo[]>>(this.apiUrl, this.getHeaders()).pipe(
            map(res => ({
                ...res,
                data: res.data ? res.data.map(g => this.mapGrupo(g)) : []
            }))
        );
    }

    misGrupos(): Observable<ApiResponse<Grupo[]>> {
        return this.http.get<ApiResponse<Grupo[]>>(`${this.apiUrl}/mis-grupos`, this.getHeaders()).pipe(
            map(res => ({
                ...res,
                data: res.data ? res.data.map(g => this.mapGrupo(g)) : []
            }))
        );
    }

    crearGrupo(formData: FormData): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(this.apiUrl, formData, this.getHeaders(true)).pipe(
            map(res => ({
                ...res,
                data: res.data ? this.mapGrupo(res.data) : null
            }))
        );
    }

    obtenerGrupo(id: number): Observable<ApiResponse<Grupo>> {
        return this.http.get<ApiResponse<Grupo>>(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
            map(res => ({
                ...res,
                data: res.data ? this.mapGrupo(res.data) : (null as any)
            }))
        );
    }

    unirseGrupo(id: number): Observable<ApiResponse<{ estado: string }>> {
        return this.http.post<ApiResponse<{ estado: string }>>(`${this.apiUrl}/${id}/unirse`, {}, this.getHeaders());
    }

    salirGrupo(id: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/salir`, {}, this.getHeaders());
    }

    obtenerPublicaciones(id: number): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${id}/publicaciones`, this.getHeaders());
    }

    // ================= Invitaciones =================

    invitarUsuario(grupoId: number, usuarioId: number): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${grupoId}/invitar`, { usuario_id: usuarioId }, this.getHeaders());
    }

    obtenerInvitaciones(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/invitaciones`, this.getHeaders()).pipe(
            map(res => ({
                ...res,
                data: res.data ? res.data.map((inv: any) => ({
                    ...inv,
                    grupo_imagen: this.resolveUrl(inv.grupo_imagen)
                })) : []
            }))
        );
    }

    responderInvitacion(invitacionId: number, accion: 'aceptar' | 'rechazar'): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/invitaciones/${invitacionId}/responder`, { accion }, this.getHeaders());
    }
}

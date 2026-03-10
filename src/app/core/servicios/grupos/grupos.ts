import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

    private getHeaders(): { headers?: HttpHeaders } {
        const token = localStorage.getItem('token');
        if (token) {
            return {
                headers: new HttpHeaders({
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                })
            };
        }
        return {};
    }

    listarGrupos(): Observable<ApiResponse<Grupo[]>> {
        return this.http.get<ApiResponse<Grupo[]>>(this.apiUrl, this.getHeaders());
    }

    misGrupos(): Observable<ApiResponse<Grupo[]>> {
        return this.http.get<ApiResponse<Grupo[]>>(`${this.apiUrl}/mis-grupos`, this.getHeaders());
    }

    crearGrupo(grupo: Partial<Grupo>): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(this.apiUrl, grupo, this.getHeaders());
    }

    obtenerGrupo(id: number): Observable<ApiResponse<Grupo>> {
        return this.http.get<ApiResponse<Grupo>>(`${this.apiUrl}/${id}`, this.getHeaders());
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
}

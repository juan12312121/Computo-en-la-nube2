import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/admin`;

    obtenerReportes(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reportes`);
    }

    eliminarPublicacion(id: number, motivo: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/publicaciones/${id}`, { body: { motivo } });
    }

    suspenderUsuario(id: number, motivo: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/usuarios/${id}/suspender`, { motivo });
    }

    obtenerLogs(): Observable<any> {
        return this.http.get(`${this.apiUrl}/logs`);
    }
}

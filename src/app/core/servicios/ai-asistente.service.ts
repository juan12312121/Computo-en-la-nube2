import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AiAsistenteService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/ai`;

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    preguntar(mensaje: string, contexto?: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/preguntar`, { mensaje, contexto }, {
            headers: this.getHeaders()
        });
    }
}

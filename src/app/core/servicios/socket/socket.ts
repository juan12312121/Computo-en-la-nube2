import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket: Socket;
    private readonly url = environment.socketUrl;

    isConnected = signal(false);

    constructor() {
        this.socket = io(this.url, {
            withCredentials: true,
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('🔌 Conectado al servidor WebSocket');
            this.isConnected.set(true);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Desconectado del servidor WebSocket');
            this.isConnected.set(false);
        });
    }

    onEvent<T>(eventName: string): Observable<T> {
        return new Observable<T>(observer => {
            this.socket.on(eventName, (data: T) => {
                observer.next(data);
            });
        });
    }

    emit(eventName: string, data: any): void {
        this.socket.emit(eventName, data);
    }

    on(eventName: string, callback: (data: any) => void): void {
        this.socket.on(eventName, callback);
    }
}

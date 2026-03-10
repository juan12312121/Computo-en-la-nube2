import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SocketService } from '../socket/socket';
import { environment } from '../../../../environments/environment';
import { AutenticacionService } from '../autenticacion/autenticacion';

import { ChatMessage, ChatConversation } from '../../modelos/chat.model';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private http = inject(HttpClient);
    private socketService = inject(SocketService);
    private authService = inject(AutenticacionService);
    private apiUrl: string;

    private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    public messages$ = this.messagesSubject.asObservable();

    public showModal = signal(false);
    public activeChatId = signal<number | null>(null);
    public activeChat = signal<ChatConversation | null>(null);
    public unreadMessages = signal(0); // 🔔 Badge de mensajes no leídos
    private currentChatId: number | null = null;

    constructor() {
        this.apiUrl = environment.apiUrl + '/chat';
        this.setupSocketListeners();
    }

    private getHeaders() {
        return {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${this.authService.getToken()}`
            })
        };
    }

    private setupSocketListeners() {
        this.socketService.on('new_message', (message: ChatMessage) => {
            const enChatActivo = this.currentChatId && Number(message.chat_id) === this.currentChatId;

            if (enChatActivo) {
                // Estamos viendo este chat → agregar al listado (sin duplicados)
                const currentMessages = this.messagesSubject.value;
                const yaExiste = currentMessages.some(m => m.id === message.id);
                if (!yaExiste) {
                    this.messagesSubject.next([...currentMessages, message]);
                }
            } else {
                // No estamos viendo este chat → notificar con badge y toast
                this.unreadMessages.update(n => n + 1);
                this.mostrarToastMensaje(message);
            }
        });
    }

    private mostrarToastMensaje(message: ChatMessage) {
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div style="
                position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                background: #1e293b; color: white; border-radius: 16px;
                padding: 14px 18px; display: flex; align-items: center; gap: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.35); min-width: 260px; max-width: 320px;
                animation: slideInRight 0.3s ease-out; cursor: pointer;
                border-left: 4px solid #6366f1;
            ">
                <div style="
                    width: 38px; height: 38px; border-radius: 50%; background: #6366f1;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 16px; flex-shrink: 0;
                ">
                    ${(message.nombre_completo || message.nombre_usuario || '?').charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="margin: 0; font-weight: 700; font-size: 13px;">
                        ${message.nombre_completo || message.nombre_usuario || 'Mensaje nuevo'}
                    </p>
                    <p style="margin: 2px 0 0; font-size: 12px; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${message.texto}
                    </p>
                </div>
                <span style="font-size: 18px;">💬</span>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        // Abrir el modal al hacer click en el toast
        toast.addEventListener('click', () => {
            this.showModal.set(true);
            document.body.removeChild(toast);
        });

        // Auto-remover tras 5 segundos
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.transition = 'opacity 0.3s ease';
                toast.style.opacity = '0';
                setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 300);
            }
        }, 5000);
    }

    obtenerChats(): Observable<ChatConversation[]> {
        return this.http.get<{ success: boolean, data: ChatConversation[] }>(`${this.apiUrl}/lista`, this.getHeaders())
            .pipe(map((res: any) => res.data));
    }

    obtenerMensajes(chatId: number): Observable<ChatMessage[]> {
        this.currentChatId = chatId;
        return this.http.get<{ success: boolean, data: ChatMessage[] }>(`${this.apiUrl}/mensajes/${chatId}`, this.getHeaders())
            .pipe(
                map((res: any) => res.data),
                tap((messages: ChatMessage[]) => this.messagesSubject.next(messages))
            );
    }

    iniciarChat(receptorId: number): Observable<ChatConversation> {
        return this.http.post<{ success: boolean, data: ChatConversation }>(`${this.apiUrl}/iniciar`, { receptorId }, this.getHeaders())
            .pipe(map((res: any) => res.data));
    }

    enviarMensaje(chatId: number, texto: string): Observable<ChatMessage> {
        return this.http.post<{ success: boolean, data: ChatMessage }>(`${this.apiUrl}/enviar`, { chatId, texto }, this.getHeaders())
            .pipe(
                map((res: any) => res.data),
                tap((message: ChatMessage) => {
                    // Agregar el mensaje del emisor inmediatamente (sin esperar socket)
                    const current = this.messagesSubject.value;
                    this.messagesSubject.next([...current, { ...message, chat_id: chatId }]);
                })
            );
    }

    aceptarSolicitud(chatId: number): Observable<boolean> {
        return this.http.put<{ success: boolean }>(`${this.apiUrl}/aceptar/${chatId}`, {}, this.getHeaders())
            .pipe(map((res: any) => res.success));
    }

    unirseAlChat(chatId: number) {
        this.socketService.emit('join_chat', chatId);
    }

    salirDelChat(chatId: number) {
        this.socketService.emit('leave_chat', chatId);
    }

    abrirChatCon(usuarioId: number) {
        this.iniciarChat(usuarioId).subscribe({
            next: (chat) => {
                this.activeChatId.set(chat.id);
                this.activeChat.set(chat);
                this.showModal.set(true);
            },
            error: (err) => {
                console.error('Error al iniciar chat:', err);
                // Si ya existe pero hubo error al "iniciar" (e.g. ya existe), 
                // podríamos intentar obtenerlo de la lista, pero el backend 
                // ya maneja el "get or create".
            }
        });
    }

    cerrarModal() {
        this.showModal.set(false);
        this.activeChatId.set(null);
        this.activeChat.set(null);
        this.currentChatId = null;
        this.messagesSubject.next([]);
    }
}

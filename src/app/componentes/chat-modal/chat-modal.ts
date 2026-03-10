import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, ChangeDetectorRef, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeService, Theme } from '../../core/servicios/temas';
import { ChatService } from '../../core/servicios/chat/chat';
import { ChatMessage, ChatConversation } from '../../core/modelos/chat.model';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';

@Component({
    selector: 'app-chat-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chat-modal.html',
    styleUrls: ['./chat-modal.css']
})
export class ChatModal implements OnInit, OnDestroy, AfterViewChecked {
    @Input() isVisible = false;
    @Output() close = new EventEmitter<void>();

    @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

    private themeService = inject(ThemeService);
    private chatService = inject(ChatService);
    private authService = inject(AutenticacionService);
    private cdr = inject(ChangeDetectorRef);

    currentTheme!: Theme;
    private themeSubscription?: Subscription;

    chats: ChatConversation[] = [];
    selectedChat: ChatConversation | null = null;
    messages: ChatMessage[] = [];
    newMessage: string = '';

    loadingChats = false;
    loadingMessages = false;
    activeTab: 'chats' | 'requests' = 'chats';
    usuarioActualId: number | null = null;

    constructor() {
        this.usuarioActualId = this.authService.obtenerUsuarioId();

        // Reaccionar a cambios en el chat activo del servicio
        effect(() => {
            const activeChat = this.chatService.activeChat();
            if (activeChat) {
                this.selectedChat = activeChat;
                this.loadingMessages = true;
                this.chatService.unirseAlChat(activeChat.id);
                this.chatService.obtenerMensajes(activeChat.id).subscribe({
                    next: (messages) => {
                        this.messages = messages;
                        this.loadingMessages = false;
                        this.cdr.detectChanges();
                    },
                    error: () => this.loadingMessages = false
                });
            }
        });
    }

    ngOnInit(): void {
        this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
            this.currentTheme = theme;
            this.cdr.detectChanges();
        });

        this.cargarChats();

        // Suscribirse a nuevos mensajes en tiempo real
        this.chatService.messages$.subscribe(messages => {
            // Solo actualizar si estamos viendo un chat y el nuevo mensaje pertenece a ese chat
            if (this.selectedChat) {
                this.messages = messages;
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy(): void {
        this.themeSubscription?.unsubscribe();
        if (this.selectedChat) {
            this.chatService.salirDelChat(this.selectedChat.id);
        }
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    scrollToBottom(): void {
        try {
            this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    cargarChats(): void {
        this.loadingChats = true;
        this.chatService.obtenerChats().subscribe({
            next: (chats) => {
                this.chats = chats;
                this.loadingChats = false;
                this.cdr.detectChanges();
            },
            error: () => this.loadingChats = false
        });
    }

    get filteredChats() {
        return this.chats.filter(c =>
            this.activeTab === 'chats' ? c.estado === 'accepted' : c.estado === 'pending'
        );
    }

    seleccionarChat(chat: ChatConversation): void {
        if (this.selectedChat) {
            this.chatService.salirDelChat(this.selectedChat.id);
        }

        this.selectedChat = chat;
        this.loadingMessages = true;
        this.chatService.unirseAlChat(chat.id);
        this.chatService.obtenerMensajes(chat.id).subscribe({
            next: (messages) => {
                this.messages = messages;
                this.loadingMessages = false;
                this.cdr.detectChanges();
            },
            error: () => this.loadingMessages = false
        });
    }

    enviarMensaje(): void {
        if (!this.newMessage.trim() || !this.selectedChat) return;

        const texto = this.newMessage;
        this.newMessage = '';

        this.chatService.enviarMensaje(this.selectedChat.id, texto).subscribe();
    }

    aceptarSolicitud(chat: ChatConversation, event: Event): void {
        event.stopPropagation();
        this.chatService.aceptarSolicitud(chat.id).subscribe(() => {
            chat.estado = 'accepted';
            this.cargarChats();
        });
    }

    cerrarModal(): void {
        this.close.emit();
    }

    onBackdropClick(event: MouseEvent): void {
        if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
            this.cerrarModal();
        }
    }

    tieneSolicitudesPendientes(): boolean {
        return this.chats.some(c => c.estado === 'pending');
    }

    cantidadSolicitudesPendientes(): number {
        return this.chats.filter(c => c.estado === 'pending').length;
    }
}

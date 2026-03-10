import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiAsistenteService } from '../../core/servicios/ai-asistente.service';
import { LucideAngularModule, MessageSquare, Send, X, Bot, User } from 'lucide-angular';

@Component({
    selector: 'app-asistente-ia',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './asistente-ia.html',
    styleUrl: './asistente-ia.css'
})
export class AsistenteIa {
    private aiService = inject(AiAsistenteService);

    isOpen = signal<boolean>(false);
    mensaje = signal<string>('');
    cargando = signal<boolean>(false);

    chats = signal<{ rol: 'ia' | 'usuario', texto: string }[]>([
        { rol: 'ia', texto: '¡Hola! Soy TRINO, tu asistente académico. ¿En qué puedo ayudarte hoy?' }
    ]);

    // Iconos
    readonly MessageSquare = MessageSquare;
    readonly Send = Send;
    readonly X = X;
    readonly Bot = Bot;
    readonly User = User;

    toggleChat() {
        this.isOpen.update(v => !v);
    }

    enviarMensaje() {
        if (!this.mensaje().trim() || this.cargando()) return;

        const texto = this.mensaje().trim();
        this.chats.update(c => [...c, { rol: 'usuario', texto }]);
        this.mensaje.set('');
        this.cargando.set(true);

        this.aiService.preguntar(texto).subscribe({
            next: (res) => {
                this.chats.update(c => [...c, { rol: 'ia', texto: res.data.respuesta }]);
                this.cargando.set(false);
            },
            error: () => {
                this.chats.update(c => [...c, { rol: 'ia', texto: 'Lo siento, hubo un error al procesar tu solicitud.' }]);
                this.cargando.set(false);
            }
        });
    }
}

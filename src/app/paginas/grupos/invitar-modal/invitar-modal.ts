import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, X, UserPlus, Check } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { SeguidorService } from '../../../core/servicios/seguidores/seguidores';
import { GruposService } from '../../../core/servicios/grupos/grupos';
import { AutenticacionService } from '../../../core/servicios/autenticacion/autenticacion';
import { ThemeService } from '../../../core/servicios/temas';

@Component({
    selector: 'app-invitar-modal',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule],
    template: `
    <div class="modal-overlay" (click)="close.emit()">
        <div class="modal-content" (click)="$event.stopPropagation()" [ngClass]="currentTheme().cardBg || ''">
            <header class="modal-header" [ngClass]="currentTheme().borderColor || ''">
                <h2 [ngClass]="currentTheme().textPrimaryClass || ''">Invitar Amigos</h2>
                <button (click)="close.emit()" class="close-btn">
                    <lucide-icon name="x" size="20"></lucide-icon>
                </button>
            </header>

            <div class="modal-body">
                <div class="search-box" [ngClass]="currentTheme().hoverBgLight || ''">
                    <lucide-icon name="search" size="18"></lucide-icon>
                    <input type="text" [(ngModel)]="filtro" placeholder="Buscar entre tus seguidos..." [ngClass]="currentTheme().textPrimaryClass || ''">
                </div>

                <div class="users-list">
                    @for (user of seguidosFiltrados(); track user.id) {
                    <div class="user-item">
                        <div class="user-info">
                            <div class="avatar" [style.background]="currentTheme().color">
                                @if (user.foto_perfil_url) {
                                    <img [src]="user.foto_perfil_url" [alt]="user.nombre_completo">
                                } @else {
                                    {{ user.nombre_completo.charAt(0) }}
                                }
                            </div>
                            <div class="details">
                                <span class="name" [ngClass]="currentTheme().textPrimaryClass || ''">{{ user.nombre_completo }}</span>
                                <span class="username" [ngClass]="currentTheme().textSecondaryClass || ''">&#64;{{ user.nombre_usuario }}</span>
                            </div>
                        </div>
                        
                        @if (invitados().includes(user.id)) {
                            <div class="invited-badge" [style.color]="currentTheme().color">
                                <lucide-icon name="check" size="18"></lucide-icon>
                                <span>Enviada</span>
                            </div>
                        } @else {
                            <button class="btn-invite" (click)="invitar(user.id)" [style.background]="currentTheme().color">
                                <lucide-icon name="user-plus" size="16"></lucide-icon>
                                <span>Invitar</span>
                            </button>
                        }
                    </div>
                    } @empty {
                        <div class="empty-state" [ngClass]="currentTheme().textSecondaryClass || ''">
                            @if (estaCargando()) {
                                <p>Cargando amigos...</p>
                            } @else {
                                <p>No se encontraron amigos para invitar.</p>
                            }
                        </div>
                    }
                </div>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
        }
        .modal-content {
            width: 100%; max-width: 450px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        .modal-header {
            padding: 1rem 1.5rem;
            display: flex; justify-content: space-between; align-items: center;
            border-b-width: 1px;
        }
        .close-btn { background: none; border: none; cursor: pointer; opacity: 0.6; }
        .modal-body { padding: 1.5rem; }
        .search-box {
            display: flex; align-items: center; padding: 0.75rem;
            border-radius: 10px; margin-bottom: 1.5rem;
        }
        .search-box input {
            background: none; border: none; outline: none;
            margin-left: 0.75rem; width: 100%;
        }
        .users-list { max-height: 350px; overflow-y: auto; }
        .user-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 0.75rem 0;
        }
        .user-info { display: flex; align-items: center; }
        .avatar {
            width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-weight: bold; margin-right: 0.75rem;
            overflow: hidden;
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .details { display: flex; flex-direction: column; }
        .name { font-weight: 600; font-size: 0.95rem; }
        .username { font-size: 0.8rem; }
        .btn-invite {
            padding: 0.5rem 1rem; border-radius: 8px; border: none;
            color: white; cursor: pointer; display: flex; align-items: center;
            gap: 0.5rem; font-size: 0.85rem; font-weight: 500;
        }
        .invited-badge { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; }
        .empty-state { text-align: center; padding: 2rem 0; }
    `]
})
export class InvitarModalComponent implements OnInit {
    @Input() grupoId!: number;
    @Output() close = new EventEmitter<void>();

    private seguidorService = inject(SeguidorService);
    private gruposService = inject(GruposService);
    private authService = inject(AutenticacionService);
    private themeService = inject(ThemeService);

    seguidos = signal<any[]>([]);
    invitados = signal<number[]>([]);
    filtro = '';
    estaCargando = signal(true);
    currentTheme = signal(this.themeService.getCurrentTheme());

    ngOnInit() {
        const userId = this.authService.obtenerUsuarioId();
        if (userId) {
            this.seguidorService.listarSeguidos(userId).subscribe(res => {
                if (res.success) {
                    this.seguidos.set(res.data.seguidos);
                }
                this.estaCargando.set(false);
            });
        }
    }

    seguidosFiltrados() {
        return this.seguidos().filter(u => 
            u.nombre_completo.toLowerCase().includes(this.filtro.toLowerCase()) ||
            u.nombre_usuario.toLowerCase().includes(this.filtro.toLowerCase())
        );
    }

    invitar(usuarioId: number) {
        this.gruposService.invitarUsuario(this.grupoId, usuarioId).subscribe(res => {
            if (res.success) {
                this.invitados.update(list => [...list, usuarioId]);
            }
        });
    }
}

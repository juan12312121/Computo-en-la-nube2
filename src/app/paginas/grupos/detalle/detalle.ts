import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { GruposService } from '../../../core/servicios/grupos/grupos';
import { Grupo } from '../../../core/modelos/grupo.model';
import { Publicacion } from '../../../core/modelos/publicacion.model';
import { PublicacionesService } from '../../../core/servicios/publicaciones/publicaciones';
import { PostCard } from '../../../componentes/post-card/post-card';
import { ThemeService } from '../../../core/servicios/temas';
import { AutenticacionService } from '../../../core/servicios/autenticacion/autenticacion';
import { LucideAngularModule, Users, Globe, Lock, Shield, Plus, MessageSquare, Image, FileText, X, UserPlus } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../componentes/navbar/navbar';
import { Subject, takeUntil } from 'rxjs';
import { InvitarModalComponent } from '../invitar-modal/invitar-modal';
import { SocketService } from '../../../core/servicios/socket/socket';

@Component({
    selector: 'app-grupo-detalle',
    imports: [
        CommonModule,
        LucideAngularModule,
        FormsModule,
        PostCard,
        Navbar,
        InvitarModalComponent
    ],
    templateUrl: './detalle.html',
    styleUrls: ['./detalle.css'],
    providers: [
        { provide: LucideAngularModule, useValue: LucideAngularModule.pick({ Users, Globe, Lock, Shield, Plus, MessageSquare, Image, FileText, X, UserPlus }) }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrupoDetalleComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private gruposService = inject(GruposService);
    private publicacionesService = inject(PublicacionesService);
    private themeService = inject(ThemeService);
    private authService = inject(AutenticacionService);
    private router = inject(Router);
    private socketService = inject(SocketService);
    private destroy$ = new Subject<void>();

    grupo = signal<Grupo | null>(null);
    publicaciones = signal<any[]>([]);
    nuevoPostTexto = signal('');
    estaCargando = signal(true);
    showInvitarModal = signal(false);
    currentTheme = signal(this.themeService.getCurrentTheme());
    usuarioActual = signal(this.authService.obtenerUsuarioActual());
    usuarioActualId = computed(() => this.usuarioActual()?.id || null);

    esMiembro = computed(() => this.grupo()?.mi_estado === 'activo');
    solicitudPendiente = computed(() => this.grupo()?.mi_estado === 'pendiente');
    esAdmin = computed(() => this.grupo()?.mi_rol === 'admin' || this.grupo()?.creador_id === this.usuarioActualId());

    ngOnInit() {
        this.route.params.subscribe(params => {
            const id = +params['id'];
            if (id) {
                this.cargarDetalle(id);
                this.setupSocketListeners(id);
            }
        });
        this.themeService.currentTheme$
            .pipe(takeUntil(this.destroy$))
            .subscribe(theme => this.currentTheme.set(theme));
    }

    ngOnDestroy() {
        if (this.grupo()) {
            this.socketService.emit('leave_group', this.grupo()!.id);
        }
        this.destroy$.next();
        this.destroy$.complete();
    }

    setupSocketListeners(grupoId: number) {
        this.socketService.emit('join_group', grupoId);

        this.socketService.on('new_post', (p: any) => {
            if (p.grupo_id === grupoId && !this.publicaciones().some(pub => pub.id === p.id)) {
                const mapped = {
                    id: p.id,
                    author: p.nombre_completo || p.nombre_usuario || 'Usuario',
                    avatar: p.foto_perfil_url || '',
                    time: p.fecha_creacion,
                    content: p.contenido,
                    image: p.imagen_url,
                    category: p.categoria || 'General',
                    categoryColor: 'teal',
                    likes: p.total_likes || 0,
                    liked: false,
                    shares: 0,
                    avatarColor: 'blue',
                    usuario_id: p.usuario_id,
                    visibilidad: p.visibilidad
                };
                this.publicaciones.set([mapped, ...this.publicaciones()]);
            }
        });
    }

    cargarDetalle(id: number) {
        this.estaCargando.set(true);
        this.gruposService.obtenerGrupo(id).subscribe(res => {
            if (res.success) {
                this.grupo.set(res.data);
                this.cargarPublicaciones(id);
            }
            this.estaCargando.set(false);
        });
    }

    cargarPublicaciones(id: number) {
        this.gruposService.obtenerPublicaciones(id).subscribe(res => {
            if (res.success) {
                const mapped = res.data.map((p: any) => ({
                    id: p.id,
                    author: p.nombre_completo || p.nombre_usuario || 'Usuario',
                    avatar: '', // Se puede calcular si es necesario
                    time: p.fecha_creacion,
                    content: p.contenido,
                    image: p.imagen_url,
                    category: p.categoria || 'General',
                    categoryColor: 'teal',
                    likes: p.total_likes || 0,
                    liked: p.usuario_dio_like === 1,
                    shares: 0,
                    avatarColor: 'blue',
                    usuario_id: p.usuario_id,
                    visibilidad: p.visibilidad
                }));
                this.publicaciones.set(mapped);
            }
        });
    }

    crearPost() {
        if (!this.nuevoPostTexto().trim()) return;

        const formData = new FormData();
        formData.append('contenido', this.nuevoPostTexto());
        formData.append('grupo_id', this.grupo()!.id.toString());

        this.publicacionesService.crearPublicacion(formData).subscribe(res => {
            if (res.success) {
                this.nuevoPostTexto.set('');
                this.cargarPublicaciones(this.grupo()!.id);
            }
        });
    }

    unirse() {
        if (!this.usuarioActualId()) {
            this.router.navigate(['/login']);
            return;
        }
        const id = this.grupo()?.id;
        if (!id) return;
        this.gruposService.unirseGrupo(id).subscribe(res => {
            if (res.success) {
                this.cargarDetalle(id);
            }
        });
    }
}

import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { GruposService } from '../../core/servicios/grupos/grupos';
import { ThemeService } from '../../core/servicios/temas';
import { Grupo } from '../../core/modelos/grupo.model';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CrearGrupoModalComponent } from './crear-modal/crear-modal';
import { Navbar } from '../../componentes/navbar/navbar';
import { AutenticacionService } from '../../core/servicios/autenticacion/autenticacion';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-grupos',
    imports: [
        CommonModule,
        LucideAngularModule,
        FormsModule,
        RouterLink,
        CrearGrupoModalComponent,
        Navbar
    ],
    templateUrl: './grupos.html',
    styleUrls: ['./grupos.css'],
    providers: [],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GruposComponent implements OnInit, OnDestroy {
    private gruposService = inject(GruposService);
    private themeService = inject(ThemeService);
    private authService = inject(AutenticacionService);
    private router = inject(Router);
    private destroy$ = new Subject<void>();

    // Signals para estado
    grupos = signal<Grupo[]>([]);
    misGrupos = signal<Grupo[]>([]);
    invitaciones = signal<any[]>([]);
    busqueda = signal('');
    showCrearModal = signal(false);
    filtroActual = signal<'todos' | 'populares' | 'mis-grupos'>('todos');
    currentTheme = signal(this.themeService.getCurrentTheme());
    totalMiembros = computed(() => this.misGrupos().reduce((acc, g) => acc + (g.total_miembros || 0), 0));

    // Filtrado reactivo
    gruposFiltrados = computed(() => {
        let list = this.grupos();
        const query = this.busqueda().toLowerCase();
        const activeFilter = this.filtroActual();

        // Aplicar búsqueda
        if (query) {
            list = list.filter(g =>
                g.nombre.toLowerCase().includes(query) ||
                g.descripcion?.toLowerCase().includes(query)
            );
        }

        // Aplicar filtro de categoría
        if (activeFilter === 'populares') {
            list = [...list].sort((a, b) => (b.total_miembros || 0) - (a.total_miembros || 0));
        } else if (activeFilter === 'mis-grupos') {
            list = list.filter(g => g.mi_estado === 'activo');
        }

        return list;
    });

    ngOnInit() {
        this.cargarDatos();
        this.themeService.currentTheme$
            .pipe(takeUntil(this.destroy$))
            .subscribe(theme => this.currentTheme.set(theme));
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    cargarDatos() {
        this.gruposService.listarGrupos().subscribe(res => {
            if (res.success) this.grupos.set(res.data);
        });

        this.gruposService.misGrupos().subscribe(res => {
            if (res.success) this.misGrupos.set(res.data);
        });

        this.gruposService.obtenerInvitaciones().subscribe(res => {
            if (res.success) this.invitaciones.set(res.data);
        });
    }

    responderInvitacion(invitacionId: number, accion: 'aceptar' | 'rechazar') {
        this.gruposService.responderInvitacion(invitacionId, accion).subscribe(res => {
            if (res.success) {
                this.cargarDatos();
            }
        });
    }

    unirse(grupoId: number) {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
        this.gruposService.unirseGrupo(grupoId).subscribe(res => {
            if (res.success) {
                // Actualizar estado localmente o recargar
                this.cargarDatos();
            }
        });
    }
}

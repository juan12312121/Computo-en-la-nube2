import { Component, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { GruposService } from '../../core/servicios/grupos/grupos';
import { ThemeService } from '../../core/servicios/temas';
import { Grupo } from '../../core/modelos/grupo.model';
import { LucideAngularModule, Search, Plus, Users, Shield, Globe, Lock, ArrowRight, MoreHorizontal, Image, FileText, MessageSquare } from 'lucide-angular';
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
    providers: [
        { provide: LucideAngularModule, useValue: LucideAngularModule.pick({ Search, Plus, Users, Shield, Globe, Lock, ArrowRight, MoreHorizontal, Image, FileText, MessageSquare }) }
    ],
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
    busqueda = signal('');
    showCrearModal = signal(false);
    currentTheme = signal(this.themeService.getCurrentTheme());
    totalMiembros = computed(() => this.misGrupos().reduce((acc, g) => acc + (g.total_miembros || 0), 0));

    // Filtrado reactivo
    gruposFiltrados = computed(() => {
        const query = this.busqueda().toLowerCase();
        return this.grupos().filter(g =>
            g.nombre.toLowerCase().includes(query) ||
            g.descripcion?.toLowerCase().includes(query)
        );
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

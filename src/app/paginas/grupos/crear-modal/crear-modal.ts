import { Component, output, signal, inject, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GruposService } from '../../../core/servicios/grupos/grupos';
import { ThemeService } from '../../../core/servicios/temas';
import { LucideAngularModule, X, Users, Globe, Lock, Shield, Image, User } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-crear-grupo-modal',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        LucideAngularModule
    ],
    providers: [
        { provide: LucideAngularModule, useValue: LucideAngularModule.pick({ X, Users, Globe, Lock, Shield, Image, User }) }
    ],
    templateUrl: './crear-modal.html',
    styleUrls: ['./crear-modal.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrearGrupoModalComponent implements OnInit, OnDestroy {
    private fb = inject(FormBuilder);
    private gruposService = inject(GruposService);
    private themeService = inject(ThemeService);
    private destroy$ = new Subject<void>();

    close = output<void>();
    created = output<any>();

    cargando = signal(false);
    currentTheme = signal(this.themeService.getCurrentTheme());
    error = signal<string | null>(null);

    grupoForm = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        descripcion: ['', [Validators.maxLength(500)]],
        privacidad: ['publico', Validators.required]
    });

    portadaFile = signal<File | null>(null);
    perfilFile = signal<File | null>(null);

    onPortadaSelected(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            this.portadaFile.set(event.target.files[0]);
        }
    }

    onPerfilSelected(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            this.perfilFile.set(event.target.files[0]);
        }
    }

    ngOnInit() {
        this.themeService.currentTheme$
            .pipe(takeUntil(this.destroy$))
            .subscribe(theme => this.currentTheme.set(theme as any));
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    cerrar() {
        this.close.emit();
    }

    crear() {
        if (this.grupoForm.invalid) return;

        this.cargando.set(true);
        this.error.set(null);

        const formData = new FormData();
        const value = this.grupoForm.value;
        formData.append('nombre', value.nombre!);
        if (value.descripcion) formData.append('descripcion', value.descripcion);
        formData.append('privacidad', value.privacidad!);

        if (this.portadaFile()) {
            formData.append('foto_portada', this.portadaFile()!);
        }
        if (this.perfilFile()) {
            formData.append('foto_perfil', this.perfilFile()!);
        }

        this.gruposService.crearGrupo(formData as any).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.created.emit(res.data);
                    this.cerrar();
                } else {
                    this.error.set(res.message || 'Error al crear el grupo');
                }
                this.cargando.set(false);
            },
            error: (err: any) => {
                this.error.set('Error en el servidor');
                this.cargando.set(false);
            }
        });
    }
}

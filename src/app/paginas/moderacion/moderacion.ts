import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/servicios/admin.service';
import { LucideAngularModule, Shield, Trash2, UserX, AlertTriangle, Eye, Clock } from 'lucide-angular';

@Component({
    selector: 'app-moderacion',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './moderacion.html',
    styleUrl: './moderacion.css'
})
export class Moderacion implements OnInit {
    private adminService = inject(AdminService);

    reportes = signal<any[]>([]);
    logs = signal<any[]>([]);
    cargando = signal<boolean>(true);
    vistaActiva = signal<'reportes' | 'logs'>('reportes');

    // Iconos
    readonly Shield = Shield;
    readonly Trash2 = Trash2;
    readonly UserX = UserX;
    readonly AlertTriangle = AlertTriangle;
    readonly Eye = Eye;
    readonly Clock = Clock;

    ngOnInit() {
        this.cargarDatos();
    }

    cargarDatos() {
        this.cargando.set(true);
        if (this.vistaActiva() === 'reportes') {
            this.adminService.obtenerReportes().subscribe({
                next: (res) => {
                    this.reportes.set(res.data);
                    this.cargando.set(false);
                },
                error: () => this.cargando.set(false)
            });
        } else {
            this.adminService.obtenerLogs().subscribe({
                next: (res) => {
                    this.logs.set(res.data);
                    this.cargando.set(false);
                },
                error: () => this.cargando.set(false)
            });
        }
    }

    cambiarVista(vista: 'reportes' | 'logs') {
        this.vistaActiva.set(vista);
        this.cargarDatos();
    }

    eliminarPost(id: number) {
        const motivo = prompt('Motivo de la eliminación:');
        if (motivo) {
            this.adminService.eliminarPublicacion(id, motivo).subscribe({
                next: () => {
                    alert('Publicación eliminada');
                    this.cargarDatos();
                }
            });
        }
    }

    suspenderUsuario(id: number) {
        const motivo = prompt('Motivo de la suspensión:');
        if (motivo) {
            this.adminService.suspenderUsuario(id, motivo).subscribe({
                next: () => {
                    alert('Usuario suspendido');
                    this.cargarDatos();
                }
            });
        }
    }
}

export interface Grupo {
    id: number;
    nombre: string;
    descripcion?: string;
    imagen_url?: string;
    imagen_portada_url?: string;
    creador_id: number;
    privacidad: 'publico' | 'privado';
    req_aprobacion: boolean;
    fecha_creacion: string;
    creador_nombre?: string;
    total_miembros?: number;
    mi_rol?: 'miembro' | 'admin' | 'moderador' | null;
    mi_estado?: 'pendiente' | 'activo' | 'rechazado' | null;
}

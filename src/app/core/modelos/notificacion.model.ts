export interface Notificacion {
    id: number;
    usuario_id: number;
    de_usuario_id: number;
    tipo: 'like' | 'comment' | 'follow';
    publicacion_id?: number;
    mensaje: string;
    leida: boolean;
    fecha_creacion: string;
    nombre_usuario: string;
    nombre_completo: string;
    foto_perfil_url?: string;
    foto_perfil_s3?: string;
}

export interface NotificacionResponse {
    success: boolean;
    message?: string;
    mensaje?: string;
    data?: any;
}

export interface ListaNotificacionesResponse {
    success: boolean;
    data: {
        notificaciones: Notificacion[];
        total: number;
        limit: number;
        offset: number;
    };
    message: string;
}

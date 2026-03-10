export interface Publicacion {
    id: number;
    usuario_id: number;
    contenido: string;
    imagen_url?: string | null;
    visibilidad: 'publico' | 'seguidores' | 'privado';
    fecha_creacion: string;
    nombre_completo: string;
    nombre_usuario: string;
    foto_perfil_url?: string | null;
    imagen_s3?: string;
    categoria?: string;
    color_categoria?: string;
    advertencia?: string;
    requiere_revision?: number;
    oculto?: number;

    // Metadatos sociales
    total_likes?: number;
    total_comentarios?: number;
    likes?: number;
    comentarios?: number;
    liked?: boolean;
    usuario_dio_like?: boolean;
}

export interface Section {
    id: number;
    nombre: string;
    icono: string;
    color: string;
    total_posts: number;
    usuario_id: number;
    fecha_creacion: string;
}

export interface CrearSeccionRequest {
    nombre: string;
    icono?: string;
    color?: string;
}

export interface SeccionConPosts {
    seccion: Section;
    posts: any[];
}

export interface AgregarPostRequest {
    seccion_id: number;
    publicacion_id: number;
}

export interface QuitarPostRequest {
    seccion_id: number;
    publicacion_id: number;
}

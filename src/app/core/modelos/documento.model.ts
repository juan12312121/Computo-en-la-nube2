export interface Documento {
    id: number;
    usuario_id: number;
    publicacion_id?: number | null;
    documento_url: string | null;
    documento_s3: string;
    nombre_archivo: string;
    tamano_archivo: number;
    tipo_archivo: string;
    icono: string;
    color: string;
    fecha_creacion: string;
    nombre_usuario?: string;
    nombre_completo?: string;
}

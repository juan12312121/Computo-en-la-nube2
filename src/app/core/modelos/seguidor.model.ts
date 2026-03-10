export interface UsuarioSeguidor {
    id: number;
    nombre_usuario: string;
    nombre_completo: string;
    foto_perfil_url?: string;
    foto_perfil_s3?: string;
    biografia?: string;
    siguiendo_desde?: string;
    es_seguidor?: boolean;
    es_seguido?: boolean;
}

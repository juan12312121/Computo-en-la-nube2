export interface Usuario {
    id: number;
    nombre_usuario: string;
    nombre_completo: string;
    foto_perfil_url?: string | null;
    rol?: string;
    email?: string;
    token?: string;
    biografia?: string;
    ubicacion?: string;
    carrera?: string;
    foto_portada_url?: string | null;
}

export interface UsuarioPerfil extends Usuario {
    biografia?: string;
    ubicacion?: string;
    carrera?: string;
    total_seguidores?: number;
    total_siguiendo?: number;
    foto_portada_url?: string;
}

export interface ChatMessage {
    id: number;
    chat_id: number;
    emisor_id: number;
    texto: string;
    leido: boolean;
    fecha_creacion: string;
    nombre_usuario?: string;
    nombre_completo?: string;
    foto_perfil_url?: string;
}

export interface ChatConversation {
    id: number;
    usuario1_id: number;
    usuario2_id: number;
    estado: 'pending' | 'accepted' | 'rejected';
    ultima_interaccion: string;
    nombre_usuario: string;
    nombre_completo: string;
    foto_perfil_url: string;
    ultimo_mensaje?: string;
    fecha_ultimo_mensaje?: string;
    no_leidos: number;
}

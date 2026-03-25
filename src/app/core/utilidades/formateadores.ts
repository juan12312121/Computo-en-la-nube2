/**
 * Obtiene las iniciales de un nombre completo.
 */
export function obtenerIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const palabras = nombre.trim().split(' ');
    return palabras.length >= 2
        ? (palabras[0][0] + palabras[1][0]).toUpperCase()
        : nombre.substring(0, 2).toUpperCase();
}

/**
 * Formatea el tiempo transcurrido desde una fecha determinada.
 */
export function formatearTiempo(fecha: string | Date): string {
    const diff = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (min < 1) return 'Ahora';
    if (min < 60) return `Hace ${min} min`;
    if (hrs < 24) return `Hace ${hrs} h`;
    if (days < 7) return `Hace ${days} d`;
    return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/**
 * Normaliza la URL de una imagen para asegurar que tenga el prefijo de la API si es necesario.
 */
export function normalizarUrlImagen(url: string, apiBaseUrl: string, folder: 'perfiles' | 'portadas' | 'publicaciones' = 'publicaciones'): string | null {
    if (!url || url.includes('/undefined')) return null;

    // Si la URL contiene múltiples esquemas http, quedarse con el último fragmento que parezca una ruta válida
    if ((url.match(/https?:\/\//g) || []).length > 1) {
        const parts = url.split(/https?:\/\//);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('/uploads/')) {
            url = `/uploads/${lastPart.split('/uploads/')[1]}`;
        } else {
            url = lastPart;
        }
    }

    // Rewrite S3 URLs to backend URL
    if (url.includes('s3.us-east-2.amazonaws.com') || url.includes('s3.amazonaws.com')) {
        const match = url.match(/\/uploads\/(.+)$/);
        if (match) return `${apiBaseUrl}/uploads/${match[1]}`;
        return url;
    }

    // Rewrite localhost and old AWS URLs to the real backend URL
    if (url.startsWith('http://localhost:3000') || url.startsWith('https://bakcend-computo-1.onrender.com')) {
        return url.replace(/https?:\/\/[^/]+(:[0-9]+)?/, apiBaseUrl);
    }

    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return `${apiBaseUrl}${url}`;

    // Si solo viene el nombre del archivo, usar el folder indicado
    if (!url.includes('/')) return `${apiBaseUrl}/uploads/${folder}/${url}`;

    // Si tiene ruta pero no es completa (ej. "perfiles/foto.jpg")
    return `${apiBaseUrl}/uploads/${url.replace(/^\/+/, '').replace(/^uploads\//, '')}`;
}

/**
 * Formatea el tamaño de un archivo en bytes a una cadena legible.
 */
export function formatearTamanoArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtiene la extensión de un archivo en mayúsculas.
 */
export function obtenerExtensionArchivo(nombreArchivo: string): string {
    return nombreArchivo ? nombreArchivo.split('.').pop()?.toUpperCase() || 'FILE' : 'FILE';
}

/**
 * Genera un color consistente basado en un ID numérico.
 */
export function generarColorAvatar(id: number, colors: string[]): string {
    return colors[id % colors.length];
}

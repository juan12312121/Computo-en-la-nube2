import { Injectable, signal } from '@angular/core';

export type SharePlatform = 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'telegram' | 'email';

@Injectable({
    providedIn: 'root'
})
export class SharingService {
    private readonly baseUrl = window.location.origin;

    private readonly shareUrls: Record<SharePlatform, (url: string, text: string) => string> = {
        whatsapp: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
        facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        telegram: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        email: (url, text) => `mailto:?subject=${encodeURIComponent('Mira esta publicación')}&body=${encodeURIComponent(text + '\n\n' + url)}`
    };

    linkCopied = signal(false);

    compartir(plataforma: SharePlatform, postId: number, contenido: string): void {
        const url = `${this.baseUrl}/principal/post/${postId}`;
        const shareUrl = this.shareUrls[plataforma]?.(url, contenido || '');

        if (shareUrl) {
            window.open(shareUrl, '_blank');
        }
    }

    async copiarAlPortapapeles(postId: number): Promise<void> {
        const url = `${this.baseUrl}/principal/post/${postId}`;
        try {
            await navigator.clipboard.writeText(url);
            this.linkCopied.set(true);
            setTimeout(() => this.linkCopied.set(false), 2000);
        } catch (err) {
            console.error('Error al copiar link:', err);
        }
    }
}

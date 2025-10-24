// ==================== services/theme.service.ts ====================
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Theme {
  id: string;
  name: string;
  color: string;
  // Clases Tailwind para cada elemento
  gradientText: string;
  icon: string;
  hoverText: string;
  buttonGradient: string;
  headerGradient: string;
  hoverBackground: string;
  bgPrimary: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  checkIcon: string;
  // Clases CSS del body/contenedor principal
  bodyClass: string;
  cardBg: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  coverBg: string;
  avatarBg: string;
  hoverBgLight: string;
  navbarBg: string;
  navbarBorder: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'trinoflow-theme';
  
  private themes: Theme[] = [
    {
      id: 'default',
      name: 'TrinoFlow Default',
      color: 'linear-gradient(to right, #f97316, #2dd4bf)',
      gradientText: 'bg-gradient-to-r from-orange-500 to-teal-400',
      icon: 'text-orange-500',
      hoverText: 'hover:text-orange-500',
      buttonGradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
      headerGradient: 'bg-gradient-to-r from-orange-500 to-teal-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-teal-50',
      bgPrimary: 'bg-orange-500',
      textPrimary: 'text-orange-600',
      textSecondary: 'text-teal-500',
      borderColor: 'border-orange-200',
      checkIcon: 'text-teal-500',
      // Clases para el body y componentes
      bodyClass: 'bg-gray-50',
      cardBg: 'bg-white border-gray-200',
      textPrimaryClass: 'text-gray-800',
      textSecondaryClass: 'text-gray-500',
      accentColor: 'text-orange-500',
      accentBg: 'bg-orange-500',
      accentBorder: 'border-orange-500',
      coverBg: 'bg-gradient-to-br from-orange-400 via-orange-500 to-teal-400',
      avatarBg: 'bg-gradient-to-br from-teal-400 to-teal-600',
      hoverBgLight: 'hover:bg-gray-100',
      navbarBg: 'bg-white',
      navbarBorder: 'border-gray-200'
    },
    {
      id: 'deep-ocean',
      name: 'Deep Ocean',
      color: 'linear-gradient(to right, #38bdf8, #0ea5e9)',
      gradientText: 'bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent',
      icon: 'text-sky-400',
      hoverText: 'hover:text-sky-400',
      buttonGradient: 'bg-gradient-to-r from-sky-400 to-blue-500',
      headerGradient: 'bg-gradient-to-r from-sky-400 to-blue-500',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-sky-50 hover:to-blue-50',
      bgPrimary: 'bg-sky-400',
      textPrimary: 'text-sky-500',
      textSecondary: 'text-blue-500',
      borderColor: 'border-sky-200',
      checkIcon: 'text-blue-500',
      // Tema oscuro
      bodyClass: 'bg-slate-900',
      cardBg: 'bg-slate-800 border-slate-700',
      textPrimaryClass: 'text-slate-100',
      textSecondaryClass: 'text-slate-400',
      accentColor: 'text-sky-400',
      accentBg: 'bg-sky-400',
      accentBorder: 'border-sky-400',
      coverBg: 'bg-gradient-to-br from-blue-500 via-blue-700 to-sky-500',
      avatarBg: 'bg-gradient-to-br from-sky-400 to-sky-500',
      hoverBgLight: 'hover:bg-slate-700',
      navbarBg: 'bg-slate-800',
      navbarBorder: 'border-slate-700'
    },
    {
      id: 'neutro',
      name: 'Neutro',
      color: 'linear-gradient(to right, #10b981, #34d399)',
      gradientText: 'bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent',
      icon: 'text-emerald-500',
      hoverText: 'hover:text-emerald-500',
      buttonGradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      headerGradient: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-50',
      bgPrimary: 'bg-emerald-500',
      textPrimary: 'text-emerald-600',
      textSecondary: 'text-emerald-400',
      borderColor: 'border-emerald-200',
      checkIcon: 'text-emerald-500',
      // Claro minimalista
      bodyClass: 'bg-gray-100',
      cardBg: 'bg-white border-gray-200',
      textPrimaryClass: 'text-gray-800',
      textSecondaryClass: 'text-gray-500',
      accentColor: 'text-emerald-500',
      accentBg: 'bg-emerald-500',
      accentBorder: 'border-emerald-500',
      coverBg: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-gray-300',
      avatarBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      hoverBgLight: 'hover:bg-gray-200',
      navbarBg: 'bg-white',
      navbarBorder: 'border-gray-200'
    },
    {
      id: 'vibrante',
      name: 'Vibrante',
      color: 'linear-gradient(to right, #ef4444, #fbbf24)',
      gradientText: 'bg-gradient-to-r from-red-500 to-yellow-400 bg-clip-text text-transparent',
      icon: 'text-red-500',
      hoverText: 'hover:text-red-500',
      buttonGradient: 'bg-gradient-to-r from-red-500 to-red-600',
      headerGradient: 'bg-gradient-to-r from-red-500 to-yellow-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-red-50 hover:to-yellow-50',
      bgPrimary: 'bg-red-500',
      textPrimary: 'text-red-600',
      textSecondary: 'text-yellow-500',
      borderColor: 'border-red-200',
      checkIcon: 'text-yellow-500',
      // Claro con colores vibrantes
      bodyClass: 'bg-orange-50',
      cardBg: 'bg-white border-red-300',
      textPrimaryClass: 'text-gray-800',
      textSecondaryClass: 'text-gray-500',
      accentColor: 'text-red-500',
      accentBg: 'bg-red-500',
      accentBorder: 'border-red-500',
      coverBg: 'bg-gradient-to-br from-red-400 via-red-500 to-yellow-400',
      avatarBg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      hoverBgLight: 'hover:bg-yellow-100',
      navbarBg: 'bg-white',
      navbarBorder: 'border-gray-200'
    },
    {
      id: 'discordia',
      name: 'Discordia',
      color: 'linear-gradient(to right, #ec4899, #a855f7)',
      gradientText: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent',
      icon: 'text-pink-500',
      hoverText: 'hover:text-pink-500',
      buttonGradient: 'bg-gradient-to-r from-pink-500 to-purple-600',
      headerGradient: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50',
      bgPrimary: 'bg-pink-500',
      textPrimary: 'text-pink-600',
      textSecondary: 'text-purple-500',
      borderColor: 'border-pink-200',
      checkIcon: 'text-purple-500',
      // Sin sentido (contraste extremo)
      bodyClass: 'bg-blue-900',
      cardBg: 'bg-yellow-400 border-red-400',
      textPrimaryClass: 'text-rose-700',
      textSecondaryClass: 'text-indigo-900',
      accentColor: 'text-emerald-500',
      accentBg: 'bg-pink-400',
      accentBorder: 'border-pink-400',
      coverBg: 'bg-gradient-to-br from-pink-400 via-yellow-400 to-blue-900',
      avatarBg: 'bg-gradient-to-br from-red-400 to-sky-600',
      hoverBgLight: 'hover:bg-yellow-200',
      navbarBg: 'bg-slate-900',
      navbarBorder: 'border-slate-700'
    }
  ];

  private currentThemeSubject = new BehaviorSubject<Theme>(this.themes[0]);
  public currentTheme$: Observable<Theme> = this.currentThemeSubject.asObservable();

  constructor() {
    this.loadThemeFromStorage();
    this.applyThemeToBody();
  }

  /**
   * Obtiene el tema actual
   */
  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Obtiene todos los temas disponibles
   */
  getThemes(): Theme[] {
    return this.themes;
  }

  /**
   * Aplica un tema por su ID
   */
  setTheme(themeId: string): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (theme) {
      this.currentThemeSubject.next(theme);
      this.saveThemeToStorage(themeId);
      this.applyThemeToBody();
    }
  }

  /**
   * Aplica las clases del tema al body
   */
  private applyThemeToBody(): void {
    const theme = this.currentThemeSubject.value;
    const body = document.body;
    
    // Eliminar todas las clases de tema anteriores
    this.themes.forEach(t => {
      body.classList.remove(t.bodyClass);
    });
    
    // Aplicar la clase del tema actual
    if (theme.bodyClass) {
      const classes = theme.bodyClass.split(' ');
      body.classList.add(...classes);
    }

    // Agregar atributo data-theme para CSS adicional si es necesario
    body.setAttribute('data-theme', theme.id);
  }

  /**
   * Guarda el tema en localStorage
   */
  private saveThemeToStorage(themeId: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, themeId);
    } catch (e) {
      console.warn('No se pudo guardar el tema en localStorage', e);
    }
  }

  /**
   * Carga el tema desde localStorage
   */
  private loadThemeFromStorage(): void {
    try {
      const savedThemeId = localStorage.getItem(this.STORAGE_KEY);
      if (savedThemeId) {
        const theme = this.themes.find(t => t.id === savedThemeId);
        if (theme) {
          this.currentThemeSubject.next(theme);
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar el tema desde localStorage', e);
    }
  }

  /**
   * Alterna entre temas (útil para testing)
   */
  toggleTheme(): void {
    const currentIndex = this.themes.findIndex(t => t.id === this.currentThemeSubject.value.id);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.setTheme(this.themes[nextIndex].id);
  }
}
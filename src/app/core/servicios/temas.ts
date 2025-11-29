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
    // ========== TEMAS BUENOS Y PROFESIONALES ==========
    {
      id: 'default',
      name: 'TrinoFlow',
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
      id: 'midnight',
      name: 'Medianoche',
      color: 'linear-gradient(to right, #6366f1, #8b5cf6)',
      gradientText: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      icon: 'text-indigo-400',
      hoverText: 'hover:text-indigo-400',
      buttonGradient: 'bg-gradient-to-r from-indigo-500 to-purple-600',
      headerGradient: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50',
      bgPrimary: 'bg-indigo-500',
      textPrimary: 'text-indigo-400',
      textSecondary: 'text-purple-400',
      borderColor: 'border-indigo-700',
      checkIcon: 'text-purple-400',
      bodyClass: 'bg-slate-950',
      cardBg: 'bg-slate-900 border-slate-800',
      textPrimaryClass: 'text-slate-100',
      textSecondaryClass: 'text-slate-400',
      accentColor: 'text-indigo-400',
      accentBg: 'bg-indigo-500',
      accentBorder: 'border-indigo-500',
      coverBg: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900',
      avatarBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
      hoverBgLight: 'hover:bg-slate-800',
      navbarBg: 'bg-slate-900',
      navbarBorder: 'border-slate-800'
    },
    {
      id: 'forest',
      name: 'Bosque',
      color: 'linear-gradient(to right, #10b981, #059669)',
      gradientText: 'bg-gradient-to-r from-emerald-500 to-green-600',
      icon: 'text-emerald-500',
      hoverText: 'hover:text-emerald-500',
      buttonGradient: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      headerGradient: 'bg-gradient-to-r from-emerald-500 to-green-600',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50',
      bgPrimary: 'bg-emerald-500',
      textPrimary: 'text-emerald-600',
      textSecondary: 'text-green-600',
      borderColor: 'border-emerald-200',
      checkIcon: 'text-green-600',
      bodyClass: 'bg-green-50',
      cardBg: 'bg-white border-emerald-200',
      textPrimaryClass: 'text-gray-800',
      textSecondaryClass: 'text-gray-600',
      accentColor: 'text-emerald-600',
      accentBg: 'bg-emerald-500',
      accentBorder: 'border-emerald-500',
      coverBg: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-400',
      avatarBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      hoverBgLight: 'hover:bg-emerald-50',
      navbarBg: 'bg-white',
      navbarBorder: 'border-emerald-200'
    },
    {
      id: 'sunset',
      name: 'Atardecer',
      color: 'linear-gradient(to right, #f59e0b, #ef4444)',
      gradientText: 'bg-gradient-to-r from-amber-500 to-red-500',
      icon: 'text-amber-500',
      hoverText: 'hover:text-amber-500',
      buttonGradient: 'bg-gradient-to-r from-amber-500 to-red-500',
      headerGradient: 'bg-gradient-to-r from-amber-500 to-red-500',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-amber-50 hover:to-red-50',
      bgPrimary: 'bg-amber-500',
      textPrimary: 'text-amber-600',
      textSecondary: 'text-red-600',
      borderColor: 'border-amber-200',
      checkIcon: 'text-red-500',
      bodyClass: 'bg-orange-50',
      cardBg: 'bg-white border-amber-200',
      textPrimaryClass: 'text-gray-800',
      textSecondaryClass: 'text-gray-600',
      accentColor: 'text-amber-600',
      accentBg: 'bg-amber-500',
      accentBorder: 'border-amber-500',
      coverBg: 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500',
      avatarBg: 'bg-gradient-to-br from-amber-500 to-red-600',
      hoverBgLight: 'hover:bg-orange-50',
      navbarBg: 'bg-white',
      navbarBorder: 'border-amber-200'
    },
    {
      id: 'ocean',
      name: 'Océano',
      color: 'linear-gradient(to right, #0ea5e9, #06b6d4)',
      gradientText: 'bg-gradient-to-r from-sky-500 to-cyan-500',
      icon: 'text-sky-500',
      hoverText: 'hover:text-sky-500',
      buttonGradient: 'bg-gradient-to-r from-sky-500 to-cyan-500',
      headerGradient: 'bg-gradient-to-r from-sky-500 to-cyan-500',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-sky-50 hover:to-cyan-50',
      bgPrimary: 'bg-sky-500',
      textPrimary: 'text-sky-600',
      textSecondary: 'text-cyan-600',
      borderColor: 'border-sky-200',
      checkIcon: 'text-cyan-500',
      bodyClass: 'bg-sky-50',
      cardBg: 'bg-white border-sky-200',
      textPrimaryClass: 'text-gray-800',
      textSecondaryClass: 'text-gray-600',
      accentColor: 'text-sky-600',
      accentBg: 'bg-sky-500',
      accentBorder: 'border-sky-500',
      coverBg: 'bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-500',
      avatarBg: 'bg-gradient-to-br from-sky-500 to-cyan-600',
      hoverBgLight: 'hover:bg-sky-50',
      navbarBg: 'bg-white',
      navbarBorder: 'border-sky-200'
    },
    {
      id: 'rose',
      name: 'Rosa',
      color: 'linear-gradient(to right, #ec4899, #f472b6)',
      gradientText: 'bg-gradient-to-r from-pink-500 to-rose-400',
      icon: 'text-pink-500',
      hoverText: 'hover:text-pink-500',
      buttonGradient: 'bg-gradient-to-r from-pink-500 to-rose-500',
      headerGradient: 'bg-gradient-to-r from-pink-500 to-rose-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50',
      bgPrimary: 'bg-pink-500',
      textPrimary: 'text-pink-600',
      textSecondary: 'text-rose-600',
      borderColor: 'border-pink-200',
      checkIcon: 'text-rose-500',
      bodyClass: 'bg-pink-50',
      cardBg: 'bg-white border-pink-200',
      textPrimaryClass: 'text-gray-800',
      textSecondaryClass: 'text-gray-600',
      accentColor: 'text-pink-600',
      accentBg: 'bg-pink-500',
      accentBorder: 'border-pink-500',
      coverBg: 'bg-gradient-to-br from-pink-400 via-rose-500 to-fuchsia-500',
      avatarBg: 'bg-gradient-to-br from-pink-500 to-rose-600',
      hoverBgLight: 'hover:bg-pink-50',
      navbarBg: 'bg-white',
      navbarBorder: 'border-pink-200'
    },
    {
      id: 'slate',
      name: 'Pizarra',
      color: 'linear-gradient(to right, #64748b, #475569)',
      gradientText: 'bg-gradient-to-r from-slate-600 to-slate-700',
      icon: 'text-slate-500',
      hoverText: 'hover:text-slate-600',
      buttonGradient: 'bg-gradient-to-r from-slate-600 to-slate-700',
      headerGradient: 'bg-gradient-to-r from-slate-600 to-slate-700',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100',
      bgPrimary: 'bg-slate-600',
      textPrimary: 'text-slate-700',
      textSecondary: 'text-slate-600',
      borderColor: 'border-slate-200',
      checkIcon: 'text-slate-700',
      bodyClass: 'bg-slate-100',
      cardBg: 'bg-white border-slate-200',
      textPrimaryClass: 'text-slate-800',
      textSecondaryClass: 'text-slate-600',
      accentColor: 'text-slate-700',
      accentBg: 'bg-slate-600',
      accentBorder: 'border-slate-600',
      coverBg: 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600',
      avatarBg: 'bg-gradient-to-br from-slate-500 to-slate-700',
      hoverBgLight: 'hover:bg-slate-100',
      navbarBg: 'bg-white',
      navbarBorder: 'border-slate-200'
    },
    {
      id: 'lavender',
      name: 'Lavanda',
      color: 'linear-gradient(to right, #a78bfa, #c084fc)',
      gradientText: 'bg-gradient-to-r from-violet-400 to-purple-400',
      icon: 'text-violet-400',
      hoverText: 'hover:text-violet-400',
      buttonGradient: 'bg-gradient-to-r from-violet-500 to-purple-500',
      headerGradient: 'bg-gradient-to-r from-violet-400 to-purple-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50',
      bgPrimary: 'bg-violet-500',
      textPrimary: 'text-violet-600',
      textSecondary: 'text-purple-600',
      borderColor: 'border-violet-200',
      checkIcon: 'text-purple-500',
      bodyClass: 'bg-violet-50',
      cardBg: 'bg-white border-violet-200',
      textPrimaryClass: 'text-gray-800',
      textSecondaryClass: 'text-gray-600',
      accentColor: 'text-violet-600',
      accentBg: 'bg-violet-500',
      accentBorder: 'border-violet-500',
      coverBg: 'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500',
      avatarBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
      hoverBgLight: 'hover:bg-violet-50',
      navbarBg: 'bg-white',
      navbarBorder: 'border-violet-200'
    },

    // ========== TEMAS EXPERIMENTALES / CAÓTICOS ==========
    {
      id: 'neon',
      name: 'Neón',
      color: 'linear-gradient(to right, #0ff, #f0f)',
      gradientText: 'bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-400',
      icon: 'text-cyan-400',
      hoverText: 'hover:text-fuchsia-400',
      buttonGradient: 'bg-gradient-to-r from-cyan-400 to-fuchsia-500',
      headerGradient: 'bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-400',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-cyan-900 hover:to-fuchsia-900',
      bgPrimary: 'bg-fuchsia-500',
      textPrimary: 'text-cyan-400',
      textSecondary: 'text-fuchsia-400',
      borderColor: 'border-cyan-500',
      checkIcon: 'text-yellow-400',
      bodyClass: 'bg-black',
      cardBg: 'bg-gray-900 border-fuchsia-500',
      textPrimaryClass: 'text-cyan-400',
      textSecondaryClass: 'text-fuchsia-300',
      accentColor: 'text-cyan-400',
      accentBg: 'bg-fuchsia-500',
      accentBorder: 'border-cyan-400',
      coverBg: 'bg-gradient-to-br from-cyan-400 via-fuchsia-600 to-yellow-400',
      avatarBg: 'bg-gradient-to-br from-fuchsia-500 to-cyan-500',
      hoverBgLight: 'hover:bg-gray-800',
      navbarBg: 'bg-black',
      navbarBorder: 'border-fuchsia-500'
    },
    {
      id: 'toxic',
      name: 'Tóxico',
      color: 'linear-gradient(to right, #84cc16, #22c55e)',
      gradientText: 'bg-gradient-to-r from-lime-500 to-green-500',
      icon: 'text-lime-400',
      hoverText: 'hover:text-lime-400',
      buttonGradient: 'bg-gradient-to-r from-lime-500 to-green-600',
      headerGradient: 'bg-gradient-to-r from-lime-500 to-green-500',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-lime-900 hover:to-green-900',
      bgPrimary: 'bg-lime-500',
      textPrimary: 'text-lime-400',
      textSecondary: 'text-green-400',
      borderColor: 'border-lime-600',
      checkIcon: 'text-green-400',
      bodyClass: 'bg-zinc-900',
      cardBg: 'bg-zinc-800 border-lime-600',
      textPrimaryClass: 'text-lime-400',
      textSecondaryClass: 'text-green-300',
      accentColor: 'text-lime-400',
      accentBg: 'bg-lime-500',
      accentBorder: 'border-lime-500',
      coverBg: 'bg-gradient-to-br from-lime-400 via-green-600 to-emerald-700',
      avatarBg: 'bg-gradient-to-br from-lime-500 to-green-600',
      hoverBgLight: 'hover:bg-zinc-700',
      navbarBg: 'bg-zinc-900',
      navbarBorder: 'border-lime-600'
    },
    {
      id: 'candy',
      name: 'Caramelo',
      color: 'linear-gradient(to right, #fbbf24, #ec4899, #8b5cf6)',
      gradientText: 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500',
      icon: 'text-yellow-400',
      hoverText: 'hover:text-pink-400',
      buttonGradient: 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500',
      headerGradient: 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-yellow-100 hover:to-purple-100',
      bgPrimary: 'bg-pink-500',
      textPrimary: 'text-pink-600',
      textSecondary: 'text-purple-600',
      borderColor: 'border-pink-300',
      checkIcon: 'text-yellow-500',
      bodyClass: 'theme-candy-body',
      cardBg: 'bg-white border-pink-300',
      textPrimaryClass: 'text-purple-800',
      textSecondaryClass: 'text-pink-600',
      accentColor: 'text-pink-500',
      accentBg: 'bg-pink-500',
      accentBorder: 'border-yellow-400',
      coverBg: 'bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600',
      avatarBg: 'bg-gradient-to-br from-pink-400 to-purple-500',
      hoverBgLight: 'hover:bg-pink-100',
      navbarBg: 'bg-white',
      navbarBorder: 'border-pink-300'
    },
    {
      id: 'chaos',
      name: 'Caos',
      color: 'linear-gradient(to right, #ff0000, #00ff00, #0000ff)',
      gradientText: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500',
      icon: 'text-red-500',
      hoverText: 'hover:text-green-500',
      buttonGradient: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500',
      headerGradient: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500',
      hoverBackground: 'hover:bg-gradient-to-r hover:from-red-100 hover:to-blue-100',
      bgPrimary: 'bg-red-500',
      textPrimary: 'text-blue-600',
      textSecondary: 'text-green-600',
      borderColor: 'border-yellow-400',
      checkIcon: 'text-purple-500',
      bodyClass: 'theme-chaos-body',
      cardBg: 'bg-yellow-100 border-red-400',
      textPrimaryClass: 'text-blue-900',
      textSecondaryClass: 'text-red-700',
      accentColor: 'text-green-600',
      accentBg: 'bg-orange-500',
      accentBorder: 'border-pink-500',
      coverBg: 'bg-gradient-to-br from-red-400 via-yellow-400 to-blue-600',
      avatarBg: 'bg-gradient-to-br from-green-500 to-purple-500',
      hoverBgLight: 'hover:bg-lime-200',
      navbarBg: 'theme-chaos-navbar',
      navbarBorder: 'border-green-400'
    }
  ];

  private currentThemeSubject = new BehaviorSubject<Theme>(this.themes[0]);
  public currentTheme$: Observable<Theme> = this.currentThemeSubject.asObservable();

  constructor() {
    this.loadThemeFromStorage();
    this.applyThemeToBody();
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  getThemes(): Theme[] {
    return this.themes;
  }

  setTheme(themeId: string): void {
    const theme = this.themes.find(t => t.id === themeId);
    if (theme) {
      this.currentThemeSubject.next(theme);
      this.saveThemeToStorage(themeId);
      this.applyThemeToBody();
    }
  }

  private applyThemeToBody(): void {
    const theme = this.currentThemeSubject.value;
    const body = document.body;
    
    // Remover todas las clases de body de todos los temas
    this.themes.forEach(t => {
      if (t.bodyClass) {
        // Dividir las clases y removerlas individualmente
        const classes = t.bodyClass.split(' ').filter(c => c.trim());
        classes.forEach(className => {
          body.classList.remove(className);
        });
      }
    });
    
    // Agregar las clases del tema actual
    if (theme.bodyClass) {
      const classes = theme.bodyClass.split(' ').filter(c => c.trim());
      body.classList.add(...classes);
    }

    body.setAttribute('data-theme', theme.id);
  }

  private saveThemeToStorage(themeId: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, themeId);
    } catch (e) {
      console.warn('No se pudo guardar el tema en localStorage', e);
    }
  }

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

  toggleTheme(): void {
    const currentIndex = this.themes.findIndex(t => t.id === this.currentThemeSubject.value.id);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    this.setTheme(this.themes[nextIndex].id);
  }
}
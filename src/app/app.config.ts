import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule, Search, Plus, Users, Shield, Globe, Lock, ArrowRight, MoreHorizontal, Image, FileText, MessageSquare, Camera, Edit, UserCheck, UserPlus, MessageCircle, X, User, SearchX } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(
      LucideAngularModule.pick({ 
        Search, Plus, Users, Shield, Globe, Lock, ArrowRight, 
        MoreHorizontal, Image, FileText, MessageSquare,
        Camera, Edit, UserCheck, UserPlus, MessageCircle, X, User, SearchX
      })
    )
  ]
};
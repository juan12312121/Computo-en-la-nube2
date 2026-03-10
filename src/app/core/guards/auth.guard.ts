import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AutenticacionService } from '../servicios/autenticacion/autenticacion';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AutenticacionService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirigir al login si no está autenticado
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AutenticacionService } from '../servicios/autenticacion/autenticacion';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AutenticacionService);
    const router = inject(Router);
    const usuario = authService.currentUserValue;

    if (authService.isAuthenticated() && usuario?.rol === 'admin') {
        return true;
    }

    // Redirigir al inicio si no es admin
    router.navigate(['/']);
    return false;
};

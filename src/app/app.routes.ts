import { Routes } from '@angular/router';
import { Login } from './autenticacion/login/login';
import { Registro } from './autenticacion/registro/registro';
import { Explorar } from './paginas/explorar/explorar';
import { Perfil } from './paginas/perfil/perfil';
import { Principal } from './paginas/principal/principal';
import { Moderacion } from './paginas/moderacion/moderacion';
import { GruposComponent } from './paginas/grupos/grupos';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'principal', pathMatch: 'full' },
  {
    path: 'principal',
    component: Principal,
    canActivate: [authGuard]
  },
  {
    path: 'principal/post/:id',
    component: Principal,
    canActivate: [authGuard]
  },
  { path: 'explorar', component: Explorar },
  {
    path: 'grupos',
    component: GruposComponent,
    canActivate: [authGuard]
  },
  {
    path: 'grupos/:id',
    loadComponent: () => import('./paginas/grupos/detalle/detalle').then(m => m.GrupoDetalleComponent),
    canActivate: [authGuard]
  },
  {
    path: 'perfil',
    component: Perfil,
    canActivate: [authGuard]
  },
  {
    path: 'perfil/:id',
    component: Perfil,
    canActivate: [authGuard]
  },
  {
    path: 'moderacion',
    component: Moderacion,
    canActivate: [adminGuard]
  },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: '**', redirectTo: 'principal' }
];
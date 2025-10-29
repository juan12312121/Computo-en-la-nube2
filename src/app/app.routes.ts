import { Routes } from '@angular/router';
import { Login } from './autenticacion/login/login';
import { Registro } from './autenticacion/registro/registro';
import { Explorar } from './paginas/explorar/explorar';
import { Perfil } from './paginas/perfil/perfil';
import { Principal } from './paginas/principal/principal';

export const routes: Routes = [
  { path: '', redirectTo: 'principal', pathMatch: 'full' },
  { path: 'principal', component: Principal },
  { path: 'explorar', component: Explorar },
  { path: 'perfil', component: Perfil },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: '**', redirectTo: 'principal' } // ← manejo de rutas no existentes
];

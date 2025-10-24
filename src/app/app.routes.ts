import { Routes } from '@angular/router';
import { Principal } from './paginas/principal/principal';
import { Explorar } from './paginas/explorar/explorar';
import { PerfilComponent } from './paginas/perfil/perfil';
import { Login } from './autenticacion/login/login';
import { Registro } from './autenticacion/registro/registro';

export const routes: Routes = [
  { path: '', redirectTo: 'principal', pathMatch: 'full' },
  { path: 'principal', component: Principal },
  { path: 'explorar', component: Explorar },
  { path: 'perfil', component: PerfilComponent },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: '**', redirectTo: 'principal' } // ← manejo de rutas no existentes
];

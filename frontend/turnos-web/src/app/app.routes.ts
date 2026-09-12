import { Routes } from '@angular/router';

import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/turnos/agendar-turno/agendar-turno').then((m) => m.AgendarTurno),
    canActivate: [authGuard],
  },
  {
    path: 'administrar-turnos',
    loadComponent: () =>
      import('./features/turnos/administrar-turnos/administrar-turnos').then(
        (m) => m.AdministrarTurnos,
      ),
    canActivate: [authGuard, adminGuard],
  },
];

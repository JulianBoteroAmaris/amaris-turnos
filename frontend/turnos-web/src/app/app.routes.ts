import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/turnos/agendar-turno/agendar-turno').then((m) => m.AgendarTurno),
  },
];

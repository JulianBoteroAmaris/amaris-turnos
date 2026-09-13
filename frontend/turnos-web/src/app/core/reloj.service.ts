import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable()
export class RelojService {
  private readonly destroyRef = inject(DestroyRef);

  readonly ahora = signal(new Date());

  constructor() {
    const intervalo = setInterval(() => this.ahora.set(new Date()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(intervalo));
  }
}

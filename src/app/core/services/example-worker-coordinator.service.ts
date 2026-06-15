import { Injectable, inject } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';
import { MessageExchangeService } from './message-exchange.service';
import { ErrorDemoService } from './error-demo.service';
import { SharedWorkerDemoService } from './shared-worker-demo.service';

/**
 * Coordina la apertura del worker correcto según el ejemplo activo (ARQUITECTURA
 * §3 / regla de oro). Algunos demos abren su worker al montar el layout (la
 * conversación/log/contador deben sobrevivir el re-montaje y el cambio de theme):
 * mensajería (03), manejo de errores (05) y SharedWorker (08). Decidir "qué demo
 * abre qué servicio" es lógica de dominio neutral, no presentación, así que vive
 * acá una sola vez en vez de duplicarse en cada example-layout de cada theme.
 *
 * Los `open()` de cada servicio son idempotentes (no-op si ya está abierto para
 * el mismo ejemplo), así que llamarlo desde un effect en cada cambio es seguro.
 */
@Injectable({ providedIn: 'root' })
export class ExampleWorkerCoordinator {
  private readonly exchange = inject(MessageExchangeService);
  private readonly errors = inject(ErrorDemoService);
  private readonly shared = inject(SharedWorkerDemoService);

  /** Abre el worker que corresponde al demo del ejemplo (no-op si no lleva uno persistente). */
  openFor(example: WorkerExample): void {
    switch (example.demo) {
      case 'message-exchange':
        this.exchange.open(example);
        break;
      case 'error-handling':
        this.errors.open(example);
        break;
      case 'shared-worker':
        this.shared.open(example);
        break;
    }
  }
}

import { Injectable, signal } from '@angular/core';
import { WorkerExample } from '../domain/examples/example.model';

/** Una línea de la bitácora de un panel: quién tocó y en qué quedó el contador. */
export interface PanelLog {
  id: number;
  by: string;
  count: number;
}

/** Vista de un panel (una conexión al SharedWorker). */
export interface PanelView {
  label: string;
  logs: PanelLog[];
}

type ServerMsg =
  | { type: 'hello'; instanceId: string; clients: number; count: number }
  | { type: 'state'; count: number; by: string; seq: number }
  | { type: 'clients'; clients: number };

interface Conn {
  label: string;
  post(message: unknown): void;
  close(): void;
}

/**
 * Demo de SharedWorker (ejemplo 08). Varias conexiones (paneles) comparten UNA
 * sola instancia del worker: cada panel abre su propio `SharedWorker` → su
 * propio `MessagePort` → el MISMO backend. El estado (contador + instanceId)
 * vive en el worker, así que los paneles ven siempre el mismo número.
 *
 * Cuando el navegador no soporta SharedWorker (o en Node/tests), cae a un
 * backend SIMULADO in-memory —rotulado como tal en la UI— para que la demo siga
 * mostrando el concepto. Estado en signals root: sobrevive el cambio de theme y
 * el SharedWorker NO se reinicia al cambiar de theme (es persistente).
 */
@Injectable({ providedIn: 'root' })
export class SharedWorkerDemoService {
  /** Id de la instancia del worker — la prueba de que todos comparten el mismo backend. */
  readonly instanceId = signal('');
  /** Conexiones (puertos) vivas contra el mismo worker. */
  readonly clients = signal(0);
  /** Contador compartido: idéntico en todos los paneles porque es UNA variable. */
  readonly count = signal(0);
  readonly panels = signal<PanelView[]>([]);
  /** False cuando se usa el backend simulado (sin SharedWorker real). */
  readonly supported = signal(true);

  private conns: Conn[] = [];
  private openId?: string;
  private factory?: () => SharedWorker;
  private logId = 0;
  private nextPort = 0;

  /** Backend simulado in-memory (fallback). Imita un único worker compartido. */
  private sim = this.makeSim();

  /** Abre la demo (idempotente: no reinicia si ya está abierta para el mismo ejemplo). */
  open(example: WorkerExample): void {
    if (this.openId === example.id && this.conns.length) {
      return;
    }
    this.close();
    this.factory = example.sharedWorkerFactory;
    this.supported.set(typeof SharedWorker !== 'undefined' && !!this.factory);
    this.openId = example.id;
    // Arranca con dos conexiones: el "compartido" se ve sin tocar nada.
    this.addPanel();
    this.addPanel();
  }

  /** Suma una conexión nueva: hereda el estado actual del worker (prueba de que vive ahí). */
  addPanel(): void {
    const label = '#' + (this.nextPort + 1);
    this.nextPort += 1;
    this.panels.update((p) => [...p, { label, logs: [] }]);
    this.conns.push(this.supported() ? this.realConn(label) : this.simConn(label));
  }

  /** Cierra una conexión (deja al menos una). El worker sigue vivo. */
  closePanel(label: string): void {
    if (this.conns.length <= 1) {
      return;
    }
    const idx = this.conns.findIndex((c) => c.label === label);
    if (idx < 0) {
      return;
    }
    this.conns[idx].post({ type: 'bye' });
    this.conns[idx].close();
    this.conns.splice(idx, 1);
    this.panels.update((p) => p.filter((panel) => panel.label !== label));
  }

  inc(label: string): void {
    this.conns.find((c) => c.label === label)?.post({ type: 'inc', portLabel: label });
  }

  reset(label: string): void {
    this.conns.find((c) => c.label === label)?.post({ type: 'reset', portLabel: label });
  }

  private receive(label: string, msg: ServerMsg): void {
    if (msg.type === 'hello') {
      this.instanceId.set(msg.instanceId);
      this.clients.set(msg.clients);
      this.count.set(msg.count);
    } else if (msg.type === 'clients') {
      this.clients.set(msg.clients);
    } else if (msg.type === 'state') {
      this.count.set(msg.count);
      this.panels.update((panels) =>
        panels.map((p) =>
          p.label === label
            ? { ...p, logs: [...p.logs, { id: this.logId++, by: msg.by, count: msg.count }] }
            : p,
        ),
      );
    }
  }

  private realConn(label: string): Conn {
    const sw = this.factory!();
    const port = sw.port;
    port.onmessage = (event: MessageEvent) => this.receive(label, event.data as ServerMsg);
    port.start();
    return {
      label,
      post: (message) => port.postMessage(message),
      close: () => port.close(),
    };
  }

  private simConn(label: string): Conn {
    const id = this.sim.connect((msg) => this.receive(label, msg));
    return {
      label,
      post: (message) => this.sim.send(message as { type: string; portLabel?: string }),
      close: () => this.sim.disconnect(id),
    };
  }

  /** Backend simulado: un único estado compartido entre todos los listeners. */
  private makeSim() {
    const instanceId = 'sim-' + Math.random().toString(36).slice(2, 6);
    let count = 0;
    let seq = 0;
    let nextId = 0;
    const listeners = new Map<number, (m: ServerMsg) => void>();
    const broadcast = (m: ServerMsg): void => listeners.forEach((l) => l(m));
    return {
      connect(cb: (m: ServerMsg) => void): number {
        const id = nextId++;
        listeners.set(id, cb);
        cb({ type: 'hello', instanceId, clients: listeners.size, count });
        broadcast({ type: 'clients', clients: listeners.size });
        return id;
      },
      send(msg: { type: string; portLabel?: string }): void {
        if (msg.type === 'inc') {
          count += 1;
          broadcast({ type: 'state', count, by: msg.portLabel ?? '?', seq: seq++ });
        } else if (msg.type === 'reset') {
          count = 0;
          broadcast({ type: 'state', count, by: msg.portLabel ?? '?', seq: seq++ });
        }
      },
      disconnect(id: number): void {
        listeners.delete(id);
        broadcast({ type: 'clients', clients: listeners.size });
      },
      reset(): void {
        count = 0;
        seq = 0;
        nextId = 0;
        listeners.clear();
      },
    };
  }

  /** Cierra TODAS las conexiones y resetea el estado (teardown completo de la demo). */
  close(): void {
    for (const c of this.conns) {
      c.post({ type: 'bye' });
      c.close();
    }
    this.conns = [];
    this.panels.set([]);
    this.instanceId.set('');
    this.clients.set(0);
    this.count.set(0);
    this.nextPort = 0;
    this.logId = 0;
    this.sim.reset();
    this.openId = undefined;
  }
}

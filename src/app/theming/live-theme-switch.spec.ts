import { TestBed } from '@angular/core/testing';
import { ExampleRunnerService } from '../core/services/example-runner.service';
import { ThreadMonitorService } from '../core/services/thread-monitor.service';
import { ThemeService } from './theme.service';
import { THEME_REGISTRY } from './theme.tokens';
import { ThemeId, ThemePack } from './theme.types';
import { WorkerExample } from '../core/domain/examples/example.model';

class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  postMessage(): void {}
  terminate(): void {}
  emit(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

function pack(id: ThemeId): ThemePack {
  const noop = () => Promise.resolve(class {});
  return { id, label: id, shell: noop, home: noop, exampleLayout: noop };
}

/**
 * El requisito clave de la arquitectura (§1 / §10.9): cambiar de theme con un
 * worker corriendo NO reinicia el estado. El runner y el monitor son singletons
 * root e independientes del ThemeService, así que un switch de theme no los toca.
 */
describe('live theme switching preserves domain state', () => {
  it('keeps the running worker and the monitor lanes across a theme switch', () => {
    // Dos themes fake: el motor es data-driven, así que alcanza con dos ids
    // cualquiera en el registry para ejercitar el switch (§10.9).
    const registry = new Map<ThemeId, ThemePack>([
      ['alpha', pack('alpha')],
      ['beta', pack('beta')],
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: THEME_REGISTRY, useValue: registry }],
    });
    const runner = TestBed.inject(ExampleRunnerService);
    const monitor = TestBed.inject(ThreadMonitorService);
    const theme = TestBed.inject(ThemeService);

    const fake = new FakeWorker();
    const example: WorkerExample = {
      id: '01-setinterval-counter',
      order: 1,
      category: 'understanding',
      i18nKey: 'examples.01-setinterval-counter',
      workerFactory: () => fake as unknown as Worker,
      snippets: {},
    };

    runner.start(example);
    fake.emit({ type: 'tick', tick: 1 });
    fake.emit({ type: 'tick', tick: 2 });
    const lanesBefore = monitor.lanes().find((l) => l.id === 'worker')!.segments.length;
    expect(runner.runningId()).toBe('01-setinterval-counter');

    // Cambiar de theme en pleno funcionamiento.
    theme.setTheme('beta');

    // El worker sigue corriendo y el monitor conserva sus carriles.
    expect(runner.runningId()).toBe('01-setinterval-counter');
    expect(monitor.lanes().find((l) => l.id === 'worker')!.segments.length).toBe(lanesBefore);

    // Y sigue emitiendo después del switch.
    fake.emit({ type: 'tick', tick: 3 });
    expect(runner.lastTick()).toBe(3);
  });
});

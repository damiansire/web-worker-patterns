import { ThreadMonitorService } from './thread-monitor.service';

describe('ThreadMonitorService', () => {
  let monitor: ThreadMonitorService;
  let t: number;

  beforeEach(() => {
    monitor = new ThreadMonitorService();
    t = 0;
    monitor.clock = () => t;
  });

  it('starts empty', () => {
    expect(monitor.lanes()).toEqual([]);
    expect(monitor.elapsedMs()).toBe(0);
  });

  it('creates a lane on first push and accumulates segments', () => {
    monitor.start();
    t = 100;
    monitor.push('worker', 'worker');
    t = 250;
    monitor.push('worker', 'idle');

    const lane = monitor.lanes().find((l) => l.id === 'worker');
    expect(lane).toBeDefined();
    expect(lane!.segments.length).toBe(2);
    // El primer segmento se cierra cuando empieza el segundo.
    expect(lane!.segments[0]).toMatchObject({ startMs: 100, endMs: 250, state: 'worker' });
    expect(lane!.segments[1]).toMatchObject({ startMs: 250, state: 'idle' });
    expect(monitor.elapsedMs()).toBe(250);
  });

  it('uses a registered label when creating a lane', () => {
    monitor.registerLane('worker', 'Worker');
    monitor.start();
    t = 10;
    monitor.push('worker', 'worker');
    expect(monitor.lanes()[0].label).toBe('Worker');
  });

  it('start() limpia los carriles del run anterior: una segunda corrida no acumula segmentos viejos', () => {
    monitor.start();
    t = 100;
    monitor.push('worker', 'worker');
    t = 200;
    monitor.push('worker', 'idle');
    expect(monitor.lanes().find((l) => l.id === 'worker')!.segments.length).toBe(2);

    // Segunda corrida: start() debe arrancar de cero (sin esto, los segmentos viejos
    // quedarían con timestamps relativos al t0 anterior → timeline imposible).
    t = 1000;
    monitor.start();
    expect(monitor.lanes()).toEqual([]);

    t = 1100;
    monitor.push('worker', 'worker');
    const seg = monitor.lanes().find((l) => l.id === 'worker')!.segments;
    expect(seg.length).toBe(1);
    // startMs es relativo al nuevo t0 (1000), no negativo ni heredado del run anterior.
    expect(seg[0].startMs).toBe(100);
    expect(seg[0].startMs).toBeGreaterThanOrEqual(0);
  });

  it('reset clears lanes and elapsed time', () => {
    monitor.start();
    t = 50;
    monitor.push('main', 'blocked');
    monitor.reset();
    expect(monitor.lanes()).toEqual([]);
    expect(monitor.elapsedMs()).toBe(0);
  });
});

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrutalistThreadVisualizer } from './brutalist-thread-visualizer.component';
import { ThreadLane } from '../../../core/services/thread-monitor.service';

describe('BrutalistThreadVisualizer', () => {
  it('renders one cell per segment and marks worker state', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(BrutalistThreadVisualizer);
    const lanes: ThreadLane[] = [
      {
        id: 'worker',
        label: 'Worker',
        segments: [
          { startMs: 0, endMs: 10, state: 'idle' },
          { startMs: 10, endMs: 20, state: 'worker' },
        ],
      },
    ];
    fixture.componentRef.setInput('lanes', lanes);
    fixture.componentRef.setInput('elapsedMs', 20);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.b-cell').length).toBe(2);
    expect(el.querySelector('.b-cell[data-state="worker"]')).toBeTruthy();
    expect(el.querySelector('.b-lane-label')?.textContent).toContain('Worker');
  });
});

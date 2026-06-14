import { describe, it, expect } from 'vitest';
import { riskyTask } from './risky.worker.logic';

describe('riskyTask', () => {
  it('cuenta las claves de primer nivel de un objeto JSON válido', () => {
    expect(riskyTask('{"a":1,"b":2}')).toBe(2);
    expect(riskyTask('{"x":1}')).toBe(1);
    expect(riskyTask('{}')).toBe(0);
  });

  it('propaga un SyntaxError real cuando el JSON está roto', () => {
    expect(() => riskyTask('{roto')).toThrow(SyntaxError);
  });

  it('rechaza payloads que no son un objeto', () => {
    expect(() => riskyTask('42')).toThrow();
    expect(() => riskyTask('[1,2,3]')).toThrow();
    expect(() => riskyTask('null')).toThrow();
  });
});

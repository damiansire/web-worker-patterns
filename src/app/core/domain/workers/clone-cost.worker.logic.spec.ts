import { buildPayload, countNodes, describePayload, serializedBytes } from './clone-cost.worker.logic';

describe('clone-cost worker logic', () => {
  describe('buildPayload', () => {
    it('builds a flat batch of `size` leaf records when depth is 0', () => {
      const payload = buildPayload({ size: 3, depth: 0 }) as unknown[];
      expect(Array.isArray(payload)).toBe(true);
      expect(payload).toHaveLength(3);
      expect(payload[0]).toEqual({ i: 0, v: 0, label: 'item-0' });
    });

    it('wraps EACH leaf in `depth` container levels', () => {
      const payload = buildPayload({ size: 1, depth: 2 }) as Array<{ lvl: number; child: unknown }>;
      expect(payload).toHaveLength(1);
      expect(payload[0].lvl).toBe(1);
      const inner = payload[0].child as { lvl: number; child: unknown };
      expect(inner.lvl).toBe(0);
      expect(inner.child).toEqual({ i: 0, v: 0, label: 'item-0' });
    });

    it('is deterministic: same config produces an equal structure', () => {
      const cfg = { size: 20, depth: 2 };
      expect(buildPayload(cfg)).toEqual(buildPayload(cfg));
    });

    it('guards against negative or fractional inputs', () => {
      expect(buildPayload({ size: -5, depth: -1 })).toEqual([]);
      expect(buildPayload({ size: 2.9, depth: 0 })).toHaveLength(2);
    });
  });

  describe('countNodes', () => {
    it('counts a primitive as one node', () => {
      expect(countNodes(42)).toBe(1);
      expect(countNodes(null)).toBe(1);
    });

    it('counts containers plus their children (one leaf record = 4 nodes)', () => {
      // { i, v, label } → 1 objeto + 3 primitivas
      expect(countNodes({ i: 0, v: 0, label: 'item-0' })).toBe(4);
      // array de 3 hojas → 1 array + 3*4
      expect(countNodes(buildPayload({ size: 3, depth: 0 }))).toBe(13);
    });
  });

  describe('describePayload', () => {
    it('grows serialized bytes with size (more data = heavier clone)', () => {
      const small = describePayload({ size: 10, depth: 0 });
      const big = describePayload({ size: 100, depth: 0 });
      expect(big.serializedBytes).toBeGreaterThan(small.serializedBytes);
    });

    it('grows node count with depth at the same size (more structure = more nodes)', () => {
      const flat = describePayload({ size: 5, depth: 0 });
      const nested = describePayload({ size: 5, depth: 4 });
      expect(nested.nodeCount).toBeGreaterThan(flat.nodeCount);
    });

    it('serializedBytes matches a direct JSON measurement', () => {
      const cfg = { size: 8, depth: 1 };
      expect(describePayload(cfg).serializedBytes).toBe(serializedBytes(buildPayload(cfg)));
    });
  });
});

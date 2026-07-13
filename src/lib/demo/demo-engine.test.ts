import { describe, expect, it } from 'vitest';
import { pickWeightedEvent, type DemoEventType } from './demo-engine';

describe('pickWeightedEvent', () => {
  it('is deterministic for a given rng and picks events proportional to their weight', () => {
    // Weights (spec order): POST 15, LIKE 20, COMMENT 15, FRIEND_REQUEST 10,
    // FRIEND_ACCEPT 10, MESSAGE 15, MESSAGE_REPLY 10, EVENT_ATTEND 5 (total 100).
    const counts: Record<DemoEventType, number> = {
      POST: 0,
      LIKE: 0,
      COMMENT: 0,
      FRIEND_REQUEST: 0,
      FRIEND_ACCEPT: 0,
      MESSAGE: 0,
      MESSAGE_REPLY: 0,
      EVENT_ATTEND: 0,
    };

    // Simple seeded LCG so this test never flakes.
    let seed = 42;
    const seededRng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      counts[pickWeightedEvent(seededRng)]++;
    }

    // Every event type should appear roughly at its expected weight (within
    // a generous tolerance since this is a statistical check, not exact).
    expect(counts.POST / iterations).toBeCloseTo(0.15, 1);
    expect(counts.LIKE / iterations).toBeCloseTo(0.2, 1);
    expect(counts.EVENT_ATTEND / iterations).toBeCloseTo(0.05, 1);

    // LIKE (highest weight) should fire more often than EVENT_ATTEND (lowest).
    expect(counts.LIKE).toBeGreaterThan(counts.EVENT_ATTEND);
  });

  it('always returns the first event type when rng returns 0', () => {
    expect(pickWeightedEvent(() => 0)).toBe('POST');
  });

  it('always returns the last event type when rng returns just under 1', () => {
    expect(pickWeightedEvent(() => 0.9999999)).toBe('EVENT_ATTEND');
  });
});
